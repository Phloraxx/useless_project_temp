import { createContext } from "react"
import type { MutableRefObject } from "react"
import type { MotionSignals } from "../types"

export const ZERO_MOTION: MotionSignals = {
  longitudinalAccel: 0,
  lateralAccel: 0,
  verticalImpulse: 0,
  yawRate: 0,
}

export const MotionSignalContext = createContext<MutableRefObject<MotionSignals> | null>(null)
