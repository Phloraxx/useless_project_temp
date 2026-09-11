import { Suspense, useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { CAMERA_STATES } from "../cinematics/cameraStates"
import type { CinematicDirector } from "../cinematics/CinematicDirector"
import type { CameraPose, DirectorFrame, MicroAnimationHook, SafetyState } from "../cinematics/types"
import { BusVisual } from "./BusVisual"

export type LabFrame = {
  director: DirectorFrame
  safety: SafetyState
  speedKmh: number
}

type Props = {
  director: CinematicDirector
  mode: "menu" | "drive"
  safeMode: boolean
  onFrame: (frame: LabFrame) => void
}

const tempPosition = new THREE.Vector3()
const tempTarget = new THREE.Vector3()
const tempScale = new THREE.Vector3(1, 1, 1)

function chasePose(anchor: THREE.Matrix4): CameraPose {
  const def = CAMERA_STATES.CHASE
  return {
    position: tempPosition.set(...def.position).clone().applyMatrix4(anchor),
    target: tempTarget.set(...def.target).clone().applyMatrix4(anchor),
    fov: def.fov,
  }
}
function DepotOffice() {
  return (
    <group position={[-10, 0, 2]}>
      <mesh castShadow receiveShadow position={[0, 2.4, 0]}>
        <boxGeometry args={[7.5, 4.8, 5.5]} />
        <meshStandardMaterial color="#d7c7a7" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.9, 2.79]}>
        <boxGeometry args={[6.5, 0.82, 0.12]} />
        <meshStandardMaterial color="#5d211d" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[1.6, 1.7, 2.9]}>
        <boxGeometry args={[2.4, 1.1, 1.25]} />
        <meshStandardMaterial color="#684f37" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[1.6, 2.38, 2.9]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.45, 0.05, 0.95]} />
        <meshStandardMaterial color="#e3d6b7" roughness={0.95} />
      </mesh>
      <mesh position={[-1.8, 2.35, 2.82]}>
        <boxGeometry args={[1.5, 1.6, 0.18]} />
        <meshStandardMaterial color="#314333" roughness={0.9} />
      </mesh>
    </group>
  )
}
function RoadSet({ colliderGroup }: { colliderGroup: React.RefObject<THREE.Group | null> }) {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.12, 34]}>
        <boxGeometry args={[14, 0.24, 100]} />
        <meshStandardMaterial color="#303337" roughness={0.96} />
      </mesh>
      <mesh receiveShadow position={[-10.5, -0.2, 34]}>
        <boxGeometry args={[7, 0.2, 100]} />
        <meshStandardMaterial color="#7c5b3d" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[10.5, -0.2, 34]}>
        <boxGeometry args={[7, 0.2, 100]} />
        <meshStandardMaterial color="#6d5138" roughness={1} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={index} position={[0, 0.02, -10 + index * 9]}>
          <boxGeometry args={[0.12, 0.025, 4.2]} />
          <meshStandardMaterial color="#d6cfac" roughness={0.9} />
        </mesh>
      ))}
      <group ref={colliderGroup}>
        <mesh castShadow position={[-6.7, 1.35, 10]}>
          <boxGeometry args={[0.45, 2.7, 10]} />
          <meshStandardMaterial color="#6a6257" />
        </mesh>
        <mesh castShadow position={[6.7, 1.2, 22]}>
          <boxGeometry args={[0.45, 2.4, 8]} />
          <meshStandardMaterial color="#7b7162" />
        </mesh>
      </group>
    </group>
  )
}
function PersonProxy({
  position,
  shirt,
  groupRef,
}: {
  position: [number, number, number]
  shirt: string
  groupRef?: React.RefObject<THREE.Group | null>
}) {
  return (
    <group position={position} ref={groupRef}>
      <mesh castShadow position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.28, 0.72, 5, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.63, 0]}>
        <sphereGeometry args={[0.26, 14, 10]} />
        <meshStandardMaterial color="#8f694f" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.18, 0]}>
        <capsuleGeometry args={[0.13, 0.58, 4, 8]} />
        <meshStandardMaterial color="#3c352e" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.2, 0.18, 0]}>
        <capsuleGeometry args={[0.13, 0.58, 4, 8]} />
        <meshStandardMaterial color="#3c352e" roughness={0.95} />
      </mesh>
    </group>
  )
}
function InteriorProxy({
  examinerRef,
  clipboardRef,
  conductorRef,
  passengerRef,
  doorRef,
}: {
  examinerRef: React.RefObject<THREE.Group | null>
  clipboardRef: React.RefObject<THREE.Mesh | null>
  conductorRef: React.RefObject<THREE.Group | null>
  passengerRef: React.RefObject<THREE.Group | null>
  doorRef: React.RefObject<THREE.Group | null>
}) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.18, -0.5]}>
        <boxGeometry args={[2.45, 0.12, 9.7]} />
        <meshStandardMaterial color="#55514a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.55, 4.5]}>
        <boxGeometry args={[2.35, 0.12, 0.18]} />
        <meshStandardMaterial color="#342f2b" />
      </mesh>
      <PersonProxy position={[-0.72, 0.28, 2.1]} shirt="#5b6b73" />
      <PersonProxy position={[0.72, 0.28, 0.15]} shirt="#d1c2a4" groupRef={examinerRef} />
      <PersonProxy position={[-0.72, 0.28, -2.6]} shirt="#7b3b32" groupRef={conductorRef} />
      <PersonProxy position={[0.72, 0.28, -1.4]} shirt="#3e6471" groupRef={passengerRef} />
      <mesh
        ref={clipboardRef}
        castShadow
        position={[0.78, 1.0, -0.25]}
        rotation={[-0.75, 0.1, 0.04]}
      >
        <boxGeometry args={[0.48, 0.04, 0.66]} />
        <meshStandardMaterial color="#cab98f" roughness={0.92} />
      </mesh>
      <group ref={doorRef} position={[1.22, 1.25, 3.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 2.4, 1.15]} />
          <meshStandardMaterial color="#4e5a5c" roughness={0.82} />
        </mesh>
      </group>
      {[-1.8, -3.5].map((z) => (
        <group key={z} position={[0, 0.55, z]}>
          <mesh position={[-0.72, 0, 0]}><boxGeometry args={[0.56, 0.55, 0.62]} /><meshStandardMaterial color="#483d35" /></mesh>
          <mesh position={[0.72, 0, 0]}><boxGeometry args={[0.56, 0.55, 0.62]} /><meshStandardMaterial color="#483d35" /></mesh>
        </group>
      ))}
    </group>
  )
}
export function PresentationScene({ director, mode, safeMode, onFrame }: Props) {
  const busRef = useRef<THREE.Group>(null)
  const visualRef = useRef<THREE.Group>(null)
  const colliderGroup = useRef<THREE.Group>(null)
  const examinerRef = useRef<THREE.Group>(null)
  const clipboardRef = useRef<THREE.Mesh>(null)
  const conductorRef = useRef<THREE.Group>(null)
  const passengerRef = useRef<THREE.Group>(null)
  const doorRef = useRef<THREE.Group>(null)
  const resultPaperRef = useRef<THREE.Mesh>(null)
  const hookUntil = useRef<Partial<Record<MicroAnimationHook, number>>>({})
  const timeScale = useRef(1)
  const reportClock = useRef(0)
  const raycaster = useRef(new THREE.Raycaster())
  const anchorMatrix = useMemo(() => new THREE.Matrix4(), [])

  useEffect(() => director.onHook((hook) => {
    hookUntil.current[hook] = performance.now() / 1000 + (hook === "result.certificate" ? 1.8 : 0.9)
  }), [director])

  const resolveCollision = (target: THREE.Vector3, desired: THREE.Vector3, radius: number) => {
    const group = colliderGroup.current
    if (!group) return desired
    const direction = desired.clone().sub(target)
    const distance = direction.length()
    if (distance < 0.01) return desired
    const ray = raycaster.current
    ray.set(target, direction.normalize())
    ray.far = distance
    const hit = ray.intersectObject(group, true)[0]
    if (!hit) return desired
    return target.clone().add(direction.multiplyScalar(Math.max(1.1, hit.distance - radius)))
  }
  useFrame(({ camera, clock }, dt) => {
    const bus = busRef.current
    if (!bus) return
    const elapsed = clock.getElapsedTime()
    const speedKmh = mode === "drive" ? (safeMode ? 4.5 : 34) : 0
    const safety: SafetyState = {
      speedKmh,
      laneConstrained: safeMode,
      agentsStable: safeMode,
      unresolvedCollision: false,
      pedestrianConflict: false,
    }

    bus.position.set(0, 0.02 + Math.sin(elapsed * 2.1) * (mode === "drive" ? 0.015 : 0.004), 0)
    bus.rotation.set(0, 0, 0)
    bus.updateMatrixWorld(true)
    anchorMatrix.compose(bus.position, bus.quaternion, tempScale)

    if (mode === "menu") {
      const menuPosition = new THREE.Vector3(-13.5 + Math.sin(elapsed * 0.12) * 0.8, 5.2, -11.5)
      camera.position.lerp(menuPosition, 1 - Math.exp(-2.6 * dt))
      camera.lookAt(0, 1.5, 1.2)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov += (48 - camera.fov) * (1 - Math.exp(-3 * dt))
        camera.updateProjectionMatrix()
      }
      if (visualRef.current) visualRef.current.visible = true
      return
    }
    const liveChase = chasePose(anchorMatrix)
    const frame = director.tick(dt, anchorMatrix, liveChase, safety, resolveCollision)
    timeScale.current = frame.gameplayTimeScale
    camera.position.copy(frame.pose.position)
    camera.lookAt(frame.pose.target)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = frame.pose.fov
      camera.updateProjectionMatrix()
    }

    const interiorShot = frame.shot.startsWith("INTERIOR_")
      || frame.shot === "DRIVER_EXAMINER_TWO_SHOT"
      || frame.shot === "MIRROR_LOOK"
    const cameraDistanceFromBus = camera.position.distanceTo(bus.position)
    const exteriorVisibleOnExit = frame.phase === "BLEND_OUT" && cameraDistanceFromBus > 4.25
    if (visualRef.current) visualRef.current.visible = !interiorShot || exteriorVisibleOnExit

    reportClock.current += dt
    if (reportClock.current >= 1 / 12) {
      reportClock.current = 0
      onFrame({ director: frame, safety, speedKmh })
    }

    const now = performance.now() / 1000
    const active = (hook: MicroAnimationHook) => (hookUntil.current[hook] ?? 0) > now
    if (examinerRef.current) {
      examinerRef.current.rotation.y = active("examiner.glance") ? -0.34 : 0
    }
    if (clipboardRef.current) {
      const writing = active("examiner.clipboardWrite")
      clipboardRef.current.rotation.z = writing ? Math.sin(elapsed * 38) * 0.035 : 0.04
    }
    if (conductorRef.current) {
      conductorRef.current.rotation.z = active("conductor.bell") ? Math.sin(elapsed * 24) * 0.16 : 0
    }
    if (passengerRef.current) {
      passengerRef.current.rotation.x = active("passenger.reaction") ? -0.12 : 0
      passengerRef.current.rotation.z = active("passenger.reaction") ? 0.08 : 0
    }
    if (doorRef.current) {
      doorRef.current.position.x = active("door.boarding") ? 1.72 : 1.22
    }
    if (resultPaperRef.current) {
      const showing = active("result.certificate")
      resultPaperRef.current.visible = showing
      const scale = showing ? 1 + Math.sin(elapsed * 5) * 0.03 : 0.01
      resultPaperRef.current.scale.setScalar(scale)
      resultPaperRef.current.rotation.z += showing ? dt * 0.15 : 0
    }
  })

  return (
    <>
      <color attach="background" args={["#9aa39c"]} />
      <fog attach="fog" args={["#9aa39c", 55, 150]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#dbe4dd", "#5f4937", 1.2]} />
      <directionalLight castShadow position={[-12, 22, -10]} intensity={2.1} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <RoadSet colliderGroup={colliderGroup} />
      <DepotOffice />
      <group ref={busRef}>
        <group ref={visualRef}>
          <Suspense fallback={null}><BusVisual /></Suspense>
        </group>
        <InteriorProxy
          examinerRef={examinerRef}
          clipboardRef={clipboardRef}
          conductorRef={conductorRef}
          passengerRef={passengerRef}
          doorRef={doorRef}
        />
      </group>
      <mesh ref={resultPaperRef} visible={false} position={[0, 2.5, -2]}>
        <boxGeometry args={[2.1, 2.8, 0.06]} />
        <meshStandardMaterial color="#e7dcc0" roughness={0.92} />
      </mesh>
      {[-18, 18].map((x) => (
        <group key={x} position={[x, 0, 16]}>
          <mesh castShadow position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.4, 0.55, 7, 8]} />
            <meshStandardMaterial color="#5b4938" />
          </mesh>
          <mesh castShadow position={[0, 7.2, 0]}>
            <sphereGeometry args={[3.1, 10, 8]} />
            <meshStandardMaterial color="#3c6044" roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  )
}
