import { useEffect, useState } from "react"
import { AnimatedCharacter } from "./AnimatedCharacter"
import type { CharacterState } from "../types"

const STATES: CharacterState[] = ["idle", "talking", "walk", "railIdle", "sitIdle", "sitTalk"]

export function StressPopulation() {
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setGeneration((value) => value + 1), 1500)
    return () => window.clearInterval(timer)
  }, [])

  const count = generation % 2 === 0 ? 12 : 4
  return <group visible={false}>
    {Array.from({ length: count }, (_, index) => (
      <group key={`${generation}-${index}`} position={[(index % 4) * 0.7, 0, Math.floor(index / 4) * 0.7]}>
        <AnimatedCharacter
          model={index % 3 === 0 ? "female" : "male"}
          role="passenger"
          state={STATES[index % STATES.length]}
          lodMode="adaptive"
        />
      </group>
    ))}
  </group>
}
