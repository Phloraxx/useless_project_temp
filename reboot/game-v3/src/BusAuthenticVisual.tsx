import { useLoader } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const MODEL_URL: string = (import.meta.env.VITE_BUS_MODEL_URL as string | undefined) || "/models/bus_v2_detail.glb"
const WHEELS = ["WHEEL_FL", "WHEEL_FR", "WHEEL_RL", "WHEEL_RR"] as const

function prepare(source: THREE.Object3D, reset = false) {
  const clone = source.clone(true)
  if (reset) {
    clone.position.set(0, 0, 0)
    clone.quaternion.identity()
    clone.scale.set(1, 1, 1)
  }
  clone.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
  clone.updateMatrixWorld(true)
  return clone
}
export function BusAuthenticBody() {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const body = useMemo(() => {
    const source = gltf.scene.getObjectByName("BODY_VISUAL")
    if (!source) throw new Error("Authentic bus GLB missing BODY_VISUAL")
    return prepare(source, true)
  }, [gltf])
  return <primitive object={body} />
}

export function BusAuthenticWheel({ index }: { index: number }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const wheel = useMemo(() => {
    const name = WHEELS[index]
    const source = name ? gltf.scene.getObjectByName(name) : null
    if (!source || !name) throw new Error(`Authentic bus GLB missing wheel ${index}`)
    return prepare(source, true)
  }, [gltf, index])
  return <primitive object={wheel} />
}

useLoader.preload(GLTFLoader, MODEL_URL)
