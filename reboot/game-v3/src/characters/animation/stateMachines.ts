import type { CharacterState } from "../types"

export type TimedState = {
  from: number
  to: number
  state: CharacterState
}

export function stateAt(elapsed: number, cycle: number, timeline: TimedState[], fallback: CharacterState) {
  const t = ((elapsed % cycle) + cycle) % cycle
  return timeline.find((entry) => t >= entry.from && t < entry.to)?.state ?? fallback
}

export const EXAMINER_TIMELINE: TimedState[] = [
  { from: 4, to: 7, state: "sitTalk" },
]

export const CONDUCTOR_TIMELINE: TimedState[] = [
  { from: 5, to: 8, state: "talking" },
  { from: 10, to: 12, state: "railCall" },
]

export const PASSENGER_CYCLE_SECONDS = 18
export const PASSENGER_TIMELINE: TimedState[] = [
  { from: 2, to: 7, state: "walk" },
  { from: 7, to: 8.1, state: "sitEnter" },
  { from: 8.1, to: 14, state: "sitIdle" },
  { from: 14, to: 16.4, state: "sitTalk" },
  { from: 16.4, to: 18, state: "sitIdle" },
]
