import { useLoader } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const MODEL_URL = "/models/bus_v2_detail.glb"
const WHEELS = ["WHEEL_FL", "WHEEL_FR", "WHEEL_RL", "WHEEL_RR"] as const

function prepareClone(source: THREE.Object3D, resetTransform = false) {
  const clone = source.clone(true)
  if (resetTransform) {
    clone.position.set(0, 0, 0)
    clone.quaternion.identity()
    clone.scale.set(1, 1, 1)
  }
  clone.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })
  clone.updateMatrixWorld(true)
  return clone
}

export function BusV2Body() {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const body = useMemo(() => {
    const source = gltf.scene.getObjectByName("BODY_VISUAL")
    if (!source) throw new Error("R2 GLB missing BODY_VISUAL")
    return prepareClone(source, true)
  }, [gltf])
  return <primitive object={body} />
}

export function BusV2Wheel({ index }: { index: number }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const wheel = useMemo(() => {
    const name = WHEELS[index]
    const source = name ? gltf.scene.getObjectByName(name) : null
    if (!source || !name) throw new Error(`R2 GLB missing wheel ${index}`)
    return prepareClone(source, true)
  }, [gltf, index])
  return <primitive object={wheel} />
}

useLoader.preload(GLTFLoader, MODEL_URL)
