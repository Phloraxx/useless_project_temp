import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"
import type { ReviewCamera as ReviewCameraMode } from "../types"

const SHOTS: Record<ReviewCameraMode, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  examiner: { pos: new THREE.Vector3(0.72, 1.55, -0.02), target: new THREE.Vector3(-0.58, 0.94, 1.72) },
  conductor: { pos: new THREE.Vector3(-0.28, 1.5, 1.0), target: new THREE.Vector3(0.74, 1.04, 2.08) },
  doorway: { pos: new THREE.Vector3(4.25, 1.58, 3.72), target: new THREE.Vector3(1.45, 0.92, 2.62) },
  aisle: { pos: new THREE.Vector3(0.08, 1.72, -3.25), target: new THREE.Vector3(0.08, 1.02, 1.2) },
}

export function ReviewCamera({ mode }: { mode: ReviewCameraMode }) {
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }, delta) => {
    const shot = SHOTS[mode]
    const t = 1 - Math.exp(-delta * 4.8)
    camera.position.lerp(shot.pos, t)
    target.lerp(shot.target, t)
    camera.lookAt(target)
  })
  return null
}
