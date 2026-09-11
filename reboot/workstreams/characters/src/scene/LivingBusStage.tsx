import { useFrame } from "@react-three/fiber"
import { useRef, useState } from "react"
import { AnimatedCharacter } from "../components/AnimatedCharacter"
import { BoardingPassenger } from "../components/BoardingPassenger"
import { StressPopulation } from "../components/StressPopulation"
import { MotionProvider } from "../animation/MotionContext"
import { CONDUCTOR_TIMELINE, EXAMINER_TIMELINE, stateAt } from "../animation/stateMachines"
import { BusInteriorMock } from "./BusInteriorMock"
import { ReviewCamera } from "./ReviewCamera"
import { SOCKETS } from "./socketLayout"
import type { CharacterState, MotionSignals, ReviewCamera as CameraMode } from "../types"

function HeroCharacters() {
  const [examiner, setExaminer] = useState<CharacterState>("sitIdle")
  const [conductor, setConductor] = useState<CharacterState>("railIdle")
  const startTime = useRef<number | null>(null)
  useFrame(({ clock }) => {
    if (startTime.current === null) startTime.current = clock.elapsedTime
    const t = clock.elapsedTime - startTime.current
    const examinerNext: CharacterState = stateAt(t, 13, EXAMINER_TIMELINE, "sitIdle")
    const conductorNext: CharacterState = stateAt(t, 13, CONDUCTOR_TIMELINE, "railIdle")
    setExaminer((v) => v === examinerNext ? v : examinerNext)
    setConductor((v) => v === conductorNext ? v : conductorNext)
  })
  const examinerSocket = SOCKETS.SOCKET_EXAMINER
  const conductorSocket = SOCKETS.SOCKET_CONDUCTOR_HOME
  return <>
    <group position={examinerSocket.position} rotation={examinerSocket.rotation}>
      <AnimatedCharacter role="examiner" state={examiner} reactionScale={0.8} />
      <mesh position={[-0.03, 0.72, 0.02]} rotation={[1.05, 0.08, -0.08]} castShadow>
        <boxGeometry args={[0.28, 0.38, 0.025]} /><meshStandardMaterial color="#6d4d2e" roughness={0.72} />
      </mesh>
    </group>
    <group position={conductorSocket.position} rotation={conductorSocket.rotation}>
      <AnimatedCharacter role="conductor" state={conductor} reactionScale={1} />
    </group>
    <BoardingPassenger />
  </>
}

export function LivingBusStage({ cameraMode, motionMode, manualMotion, stressMode = false }: {
  cameraMode: CameraMode
  motionMode: "demo" | "manual"
  manualMotion: MotionSignals
  stressMode?: boolean
}) {
  return <>
    <color attach="background" args={["#c9d4d6"]} />
    <fog attach="fog" args={["#c9d4d6", 11, 26]} />
    <hemisphereLight intensity={1.35} color="#fff4dd" groundColor="#59666b" />
    <directionalLight position={[3.5, 7, 4]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
    <ambientLight intensity={0.42} />
    <MotionProvider mode={motionMode} manual={manualMotion}>
      <BusInteriorMock />
      <HeroCharacters />
      {stressMode && <StressPopulation />}
    </MotionProvider>
    <ReviewCamera mode={cameraMode} />
  </>
}
