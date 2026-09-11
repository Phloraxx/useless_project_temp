export type BusTuning = {
  engineForce: number
  brakeImpulse: number
  maxSpeedKmh: number
  maxReverseKmh: number
  throttleRise: number
  throttleFall: number
  brakeRise: number
  brakeFall: number
  maxSteerDeg: number
  highSpeedSteerDeg: number
  steerFadeStartKmh: number
  steerFadeEndKmh: number
  steerResponse: number
  suspensionRestLength: number
  suspensionStiffness: number
  suspensionCompression: number
  suspensionRelaxation: number
  maxSuspensionTravel: number
  maxSuspensionForce: number
  frictionSlip: number
  sideFrictionStiffness: number
  bodyRollGain: number
  bodyPitchGain: number
  bodyMotionResponse: number
  shiftDurationMs: number
  highSpeedYawDamping: number
  cameraDistance: number
  cameraHeight: number
  cameraLookAhead: number
  cameraSpring: number
  cameraLookSpring: number
  cameraSpeedPullback: number
  cameraFovBoost: number
}

export const DEFAULT_TUNING: BusTuning = {
  engineForce: 11800,
  brakeImpulse: 340,
  maxSpeedKmh: 67,
  maxReverseKmh: 13,
  throttleRise: 1.85,
  throttleFall: 3.5,
  brakeRise: 4.9,
  brakeFall: 6.5,
  maxSteerDeg: 31,
  highSpeedSteerDeg: 8.5,
  steerFadeStartKmh: 18,
  steerFadeEndKmh: 62,
  steerResponse: 2.75,
  suspensionRestLength: 0.39,
  suspensionStiffness: 32,
  suspensionCompression: 4.8,
  suspensionRelaxation: 5.8,
  maxSuspensionTravel: 0.27,
  maxSuspensionForce: 82000,
  frictionSlip: 3.25,
  sideFrictionStiffness: 1.28,
  bodyRollGain: 0.020,
  bodyPitchGain: 0.014,
  bodyMotionResponse: 4.9,
  shiftDurationMs: 320,
  highSpeedYawDamping: 0.34,
  cameraDistance: 11.8,
  cameraHeight: 5.1,
  cameraLookAhead: 6.2,
  cameraSpring: 40,
  cameraLookSpring: 54,
  cameraSpeedPullback: 2.7,
  cameraFovBoost: 5.5,
}

export const BUILTIN_PRESETS: Record<"Heavy" | "Balanced" | "Maniac", BusTuning> = {
  Balanced: { ...DEFAULT_TUNING },
  Heavy: {
    ...DEFAULT_TUNING,
    engineForce: 10500,
    brakeImpulse: 315,
    maxSpeedKmh: 64,
    throttleRise: 1.45,
    highSpeedSteerDeg: 7.5,
    steerResponse: 2.25,
    suspensionStiffness: 29,
    suspensionCompression: 5.2,
    suspensionRelaxation: 6.5,
    maxSuspensionTravel: 0.30,
    maxSuspensionForce: 86000,
    frictionSlip: 3.0,
    sideFrictionStiffness: 1.18,
    bodyRollGain: 0.024,
    bodyPitchGain: 0.016,
    bodyMotionResponse: 4.1,
    shiftDurationMs: 365,
    highSpeedYawDamping: 0.40,
    cameraDistance: 12.4,
    cameraSpring: 34,
    cameraLookSpring: 46,
  },
  Maniac: {
    ...DEFAULT_TUNING,
    engineForce: 14000,
    brakeImpulse: 385,
    maxSpeedKmh: 70,
    throttleRise: 2.35,
    maxSteerDeg: 32,
    highSpeedSteerDeg: 9.5,
    steerFadeEndKmh: 65,
    steerResponse: 3.35,
    suspensionStiffness: 36,
    suspensionCompression: 4.5,
    suspensionRelaxation: 5.3,
    maxSuspensionTravel: 0.24,
    maxSuspensionForce: 88000,
    frictionSlip: 3.4,
    sideFrictionStiffness: 1.30,
    bodyRollGain: 0.017,
    bodyPitchGain: 0.012,
    bodyMotionResponse: 6.2,
    shiftDurationMs: 270,
    highSpeedYawDamping: 0.32,
    cameraDistance: 11.2,
    cameraSpring: 50,
    cameraLookSpring: 66,
    cameraSpeedPullback: 3.1,
    cameraFovBoost: 6.5,
  },
}

export const BUS = {
  massKg: 13200,
  wheelbaseM: 5.64,
  trackWidthM: 2.04,
  wheelRadiusM: 0.48,
  colliderHalfExtents: [1.18, 0.56, 5.28] as const,
  comOffsetY: -0.24,
  linearDamping: 0.075,
  angularDamping: 1.22,
  fixedDt: 1 / 60,
  maxSubsteps: 5,
  start: { x: 0, y: 1.04, z: 0 },
} as const

export const SURFACE_GRIP = {
  asphalt: 1,
  wet: 0.64,
  laterite: 0.48,
  rough: 0.88,
} as const

export type SurfaceType = keyof typeof SURFACE_GRIP

export type WheelTelemetry = {
  contact: boolean
  suspensionLength: number
  suspensionForce: number
  forwardImpulse: number
  sideImpulse: number
}

export type Telemetry = {
  ready: boolean
  speedKmh: number
  position: [number, number, number]
  steeringDeg: number
  throttle: number
  brake: number
  rollDeg: number
  pitchDeg: number
  yawDeg: number
  bodyRollDeg: number
  bodyPitchDeg: number
  yawRateDeg: number
  longitudinalAccel: number
  lateralAccel: number
  surface: SurfaceType
  gear: number
  normalizedRpm: number
  drivetrainLoad: number
  shifting: boolean
  shiftProgress: number
  shiftSerial: number
  impactSerial: number
  impactSpeedKmh: number
  wheels: WheelTelemetry[]
}

export const EMPTY_TELEMETRY: Telemetry = {
  ready: false,
  speedKmh: 0,
  position: [0, 0, 0],
  steeringDeg: 0,
  throttle: 0,
  brake: 0,
  rollDeg: 0,
  pitchDeg: 0,
  yawDeg: 0,
  bodyRollDeg: 0,
  bodyPitchDeg: 0,
  yawRateDeg: 0,
  longitudinalAccel: 0,
  lateralAccel: 0,
  surface: "asphalt",
  gear: 1,
  normalizedRpm: 0.18,
  drivetrainLoad: 0,
  shifting: false,
  shiftProgress: 0,
  shiftSerial: 0,
  impactSerial: 0,
  impactSpeedKmh: 0,
  wheels: Array.from({ length: 4 }, () => ({
    contact: false,
    suspensionLength: 0,
    suspensionForce: 0,
    forwardImpulse: 0,
    sideImpulse: 0,
  })),
}
