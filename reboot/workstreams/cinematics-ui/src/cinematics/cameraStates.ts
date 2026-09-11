import type { CameraStateDefinition, CameraStateName } from "./types"

const state = (
  name: CameraStateName,
  position: [number, number, number],
  target: [number, number, number],
  fov: number,
  blendIn: number,
  blendOut: number,
  minHold: number,
  collisionRadius = 0.35,
  lockGameplay = false,
  allowAtSpeed = false,
): CameraStateDefinition => ({
  name,
  position,
  target,
  fov,
  blendIn,
  blendOut,
  minHold,
  collisionRadius,
  lockGameplay,
  allowAtSpeed,
})

export const CAMERA_STATES: Record<CameraStateName, CameraStateDefinition> = {
  CHASE: state("CHASE", [0, 4.9, -13.2], [0, 1.7, 6.2], 52, 0.45, 0.45, 0, 0.45, false, true),
  CHASE_TIGHT: state("CHASE_TIGHT", [0, 3.6, -8.8], [0, 1.6, 5.4], 49, 0.42, 0.46, 1.1, 0.4, false, true),
  SIDE_STOP_MEASURE: state("SIDE_STOP_MEASURE", [-9.5, 2.3, 1.2], [0, 0.9, 1.8], 43, 0.58, 0.58, 1.6),
  FRONT_3Q_BUS: state("FRONT_3Q_BUS", [-6.8, 2.6, 10.2], [0, 1.45, 1.8], 46, 0.62, 0.62, 1.8),
  LOW_WHEEL: state("LOW_WHEEL", [-2.15, 0.78, 3.0], [-1.05, 0.62, 2.3], 42, 0.5, 0.58, 1.1, 0.22),
  INTERIOR_EXAMINER_MEDIUM: state("INTERIOR_EXAMINER_MEDIUM", [0.65, 2.05, 2.15], [1.05, 1.55, 0.1], 48, 0.68, 0.7, 1.7, 0.18, true),
  INTERIOR_EXAMINER_CLOSE: state("INTERIOR_EXAMINER_CLOSE", [0.78, 1.82, 0.25], [1.0, 1.58, -0.65], 42, 0.72, 0.72, 1.5, 0.15, true),
  DRIVER_EXAMINER_TWO_SHOT: state("DRIVER_EXAMINER_TWO_SHOT", [0, 2.12, 1.25], [0, 1.48, -0.35], 52, 0.72, 0.72, 1.9, 0.16, true),
  INTERIOR_PASSENGER: state("INTERIOR_PASSENGER", [-0.25, 2.05, -1.4], [-0.85, 1.45, -3.25], 50, 0.68, 0.68, 1.5, 0.16, true),
  INTERIOR_CONDUCTOR: state("INTERIOR_CONDUCTOR", [-0.35, 2.15, -2.7], [-0.9, 1.5, -4.2], 50, 0.68, 0.68, 1.4, 0.16, true),
  DOOR_BOARDING: state("DOOR_BOARDING", [4.9, 1.8, 3.5], [1.15, 1.05, 3.0], 48, 0.62, 0.62, 1.8, 0.28),
  MIRROR_LOOK: state("MIRROR_LOOK", [-0.55, 2.22, 3.9], [-1.55, 2.15, 2.4], 45, 0.5, 0.52, 1.0, 0.16, false, true),
  ROAD_REVEAL: state("ROAD_REVEAL", [-5.8, 5.8, 5.5], [0, 1.0, 27], 55, 0.72, 0.72, 2.2, 0.45, false, true),
  MONSOON_REVEAL: state("MONSOON_REVEAL", [6.2, 4.9, 1.5], [0, 1.4, 22], 54, 0.78, 0.78, 2.5, 0.45, false, true),
  RUN_END_WIDE: state("RUN_END_WIDE", [-12, 6.8, -4], [0, 1.2, 6], 48, 0.9, 0.9, 3.2, 0.55, true),
}

export const CAMERA_STATE_NAMES = Object.keys(CAMERA_STATES) as CameraStateName[]
