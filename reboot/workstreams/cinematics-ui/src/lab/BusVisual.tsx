import { useLoader } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const MODEL_URL = "/models/bus_v2_detail.glb"

export function BusVisual() {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [gltf])

  return <primitive object={model} />
}

useLoader.preload(GLTFLoader, MODEL_URL)
