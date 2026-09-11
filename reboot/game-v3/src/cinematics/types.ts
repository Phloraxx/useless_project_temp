import type * as THREE from "three"

export type CameraStateName =
  | "CHASE"
  | "CHASE_TIGHT"
  | "SIDE_STOP_MEASURE"
  | "FRONT_3Q_BUS"
  | "LOW_WHEEL"
  | "INTERIOR_EXAMINER_MEDIUM"
  | "INTERIOR_EXAMINER_CLOSE"
  | "DRIVER_EXAMINER_TWO_SHOT"
  | "INTERIOR_PASSENGER"
  | "INTERIOR_CONDUCTOR"
  | "DOOR_BOARDING"
  | "MIRROR_LOOK"
  | "ROAD_REVEAL"
  | "MONSOON_REVEAL"
  | "RUN_END_WIDE"

export type MicroAnimationHook =
  | "examiner.clipboardWrite"
  | "examiner.glance"
  | "mirror.check"
  | "conductor.bell"
  | "passenger.reaction"
  | "door.boarding"
  | "result.certificate"
export type SafetyState = {
  speedKmh: number
  laneConstrained: boolean
  agentsStable: boolean
  unresolvedCollision: boolean
  pedestrianConflict: boolean
}

export type CameraPose = {
  position: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

export type CameraStateDefinition = {
  name: CameraStateName
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  blendIn: number
  blendOut: number
  minHold: number
  collisionRadius: number
  lockGameplay?: boolean
  allowAtSpeed?: boolean
}
export type SubtitleBeat = {
  speaker?: string
  text: string
  tone?: "dialogue" | "grading" | "objective"
}

export type CinematicRequest = {
  id: string
  shot: CameraStateName
  duration?: number
  subtitle?: SubtitleBeat
  hook?: MicroAnimationHook
  skippable?: boolean
  requiresSafeState?: boolean
  pauseWhenSafe?: boolean
  unsafeFallbackHook?: MicroAnimationHook
}

export type DirectorFrame = {
  shot: CameraStateName
  pose: CameraPose
  gameplayTimeScale: number
  inputAuthority: number
  subtitle: SubtitleBeat | null
  activeRequestId: string | null
  queuedCount: number
  phase: "CHASE" | "BLEND_IN" | "HOLD" | "BLEND_OUT"
}
