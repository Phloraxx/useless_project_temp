import type { CharacterRole, CharacterState } from "../types"

export const CLIP_BY_STATE: Record<CharacterState, string> = {
  idle: "Idle_Loop",
  talking: "Idle_Talking_Loop",
  foldArms: "Idle_FoldArms_Loop",
  railIdle: "Idle_Rail_Loop",
  railCall: "Idle_Rail_Call",
  walk: "Walk_Loop",
  walkCarry: "Walk_Carry_Loop",
  sitEnter: "Sitting_Enter",
  sitIdle: "Sitting_Idle_Loop",
  sitTalk: "Sitting_Talking_Loop",
  sitExit: "Sitting_Exit",
}

export const ROLE_STATES: Record<CharacterRole, CharacterState[]> = {
  examiner: ["sitIdle", "sitTalk", "foldArms"],
  conductor: ["railIdle", "talking", "railCall", "walk"],
  passenger: ["idle", "walk", "walkCarry", "sitEnter", "sitIdle", "sitTalk", "sitExit"],
}

export const ONE_SHOT_STATES = new Set<CharacterState>(["sitEnter", "sitExit"])
export const DEFAULT_CROSSFADE = 0.28
