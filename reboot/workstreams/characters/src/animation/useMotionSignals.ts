import { useContext } from "react"
import { MotionSignalContext } from "./motionSignalStore"

export function useMotionSignals() {
  const value = useContext(MotionSignalContext)
  if (!value) throw new Error("AnimatedCharacter must be inside MotionProvider")
  return value
}
