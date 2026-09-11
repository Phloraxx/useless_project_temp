export type CharacterRole = "examiner" | "conductor" | "passenger"
export type CharacterModel = "male" | "female"
export type CharacterState =
  | "idle" | "talking" | "foldArms" | "railIdle" | "railCall"
  | "walk" | "walkCarry" | "sitEnter" | "sitIdle" | "sitTalk" | "sitExit"

export type MotionSignals = {
  longitudinalAccel: number
  lateralAccel: number
  verticalImpulse: number
  yawRate: number
}

export type ReviewCamera = "examiner" | "conductor" | "doorway" | "aisle"
