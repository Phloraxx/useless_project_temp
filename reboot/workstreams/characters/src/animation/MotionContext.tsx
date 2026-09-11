import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { PropsWithChildren } from "react"
import type { MotionSignals } from "../types"
import { MotionSignalContext, ZERO_MOTION } from "./motionSignalStore"

type MotionMode = "demo" | "manual"

export function MotionProvider({ children, mode, manual }: PropsWithChildren<{ mode: MotionMode; manual: MotionSignals }>) {
  const ref = useRef<MotionSignals>({ ...ZERO_MOTION })
  useFrame(({ clock }) => {
    if (mode === "manual") { Object.assign(ref.current, manual); return }
    const t = clock.elapsedTime
    const brake = Math.max(0, Math.sin(t * 0.72)) ** 12
    const accel = Math.max(0, Math.sin(t * 0.72 + Math.PI)) ** 8
    const bumpPhase = t % 6.5
    ref.current.longitudinalAccel = accel * 1.8 - brake * 3.2
    ref.current.lateralAccel = Math.sin(t * 0.43) * 1.35
    ref.current.yawRate = Math.sin(t * 0.43) * 0.22
    ref.current.verticalImpulse = bumpPhase < 0.42 ? Math.sin((bumpPhase / 0.42) * Math.PI) * 2.2 : 0
  })
  return <MotionSignalContext.Provider value={ref}>{children}</MotionSignalContext.Provider>
}
