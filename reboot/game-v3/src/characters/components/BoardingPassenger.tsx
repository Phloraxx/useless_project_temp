import { useFrame } from "@react-three/fiber"
import { useRef, useState } from "react"
import * as THREE from "three"
import { AnimatedCharacter } from "./AnimatedCharacter"
import { PASSENGER_CYCLE_SECONDS, PASSENGER_TIMELINE, stateAt } from "../animation/stateMachines"
import { SOCKETS } from "../scene/socketLayout"
import type { CharacterState } from "../types"

const OUTSIDE = new THREE.Vector3(2.18, -0.28, 2.88)
const DOOR = new THREE.Vector3(...SOCKETS.SOCKET_DOOR_ENTRY.position)
const AISLE = new THREE.Vector3(...SOCKETS.SOCKET_AISLE_02.position)
const SEAT = new THREE.Vector3(...SOCKETS.SOCKET_SEAT_01.position)
const TMP = new THREE.Vector3()

function segment(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return out.copy(a).lerp(b, THREE.MathUtils.smoothstep(t, 0, 1))
}

export function BoardingPassenger() {
  const group = useRef<THREE.Group>(null)
  const startTime = useRef<number | null>(null)
  const [state, setState] = useState<CharacterState>("idle")
  useFrame(({ clock }) => {
    if (startTime.current === null) startTime.current = clock.elapsedTime
    const elapsed = clock.elapsedTime - startTime.current
    const t = (elapsed + 8.5) % PASSENGER_CYCLE_SECONDS
    const next: CharacterState = stateAt(t, PASSENGER_CYCLE_SECONDS, PASSENGER_TIMELINE, "idle")
    if (t < 2) TMP.copy(OUTSIDE)
    else if (t < 4.5) { segment(TMP, OUTSIDE, DOOR, (t - 2) / 2.5) }
    else if (t < 7) { segment(TMP, DOOR, AISLE, (t - 4.5) / 2.5) }
    else TMP.copy(SEAT)
    if (group.current) group.current.position.lerp(TMP, 0.22)
    setState((current) => current === next ? current : next)
  })
  return <group ref={group} rotation-y={Math.PI}>
    <AnimatedCharacter model="female" role="passenger" state={state} reactionScale={1} scale={1} lodMode="adaptive" />
  </group>
}
