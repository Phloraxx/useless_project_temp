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
  cameraDistance: number
  cameraHeight: number
  cameraLookAhead: number
  cameraSpring: number
  cameraLookSpring: number
  cameraSpeedPullback: number
  cameraFovBoost: number
}

export const DEFAULT_TUNING: BusTuning = {
  engineForce: 10500,
  brakeImpulse: 320,
  maxSpeedKmh: 62,
  maxReverseKmh: 13,
  throttleRise: 1.8,
  throttleFall: 3.4,
  brakeRise: 4.8,
  brakeFall: 6.5,
  maxSteerDeg: 30,
  highSpeedSteerDeg: 9.5,
  steerFadeStartKmh: 16,
  steerFadeEndKmh: 58,
  steerResponse: 2.8,
  suspensionRestLength: 0.38,
  suspensionStiffness: 34,
  suspensionCompression: 4.6,
  suspensionRelaxation: 5.4,
  maxSuspensionTravel: 0.24,
  maxSuspensionForce: 72000,
  frictionSlip: 3.2,
  sideFrictionStiffness: 1.25,
  bodyRollGain: 0.018,
  bodyPitchGain: 0.012,
  bodyMotionResponse: 5.2,
  cameraDistance: 11.5,
  cameraHeight: 5.0,
  cameraLookAhead: 6.0,
  cameraSpring: 42,
  cameraLookSpring: 56,
  cameraSpeedPullback: 2.4,
  cameraFovBoost: 5.0,
}


export const BUILTIN_PRESETS: Record<"Heavy" | "Balanced" | "Arcade", BusTuning> = {
  Balanced: { ...DEFAULT_TUNING },
  Heavy: {
    ...DEFAULT_TUNING,
    engineForce: 9500,
    maxSpeedKmh: 60,
    throttleRise: 1.4,
    brakeImpulse: 300,
    highSpeedSteerDeg: 8,
    steerResponse: 2.3,
    suspensionStiffness: 30,
    suspensionCompression: 5.0,
    suspensionRelaxation: 6.2,
    maxSuspensionTravel: 0.28,
    maxSuspensionForce: 78000,
    frictionSlip: 3.0,
    sideFrictionStiffness: 1.18,
    bodyRollGain: 0.022,
    bodyPitchGain: 0.014,
    bodyMotionResponse: 4.3,
    cameraDistance: 12.2,
    cameraSpring: 34,
    cameraLookSpring: 46,
  },
  Arcade: {
    ...DEFAULT_TUNING,
    engineForce: 12500,
    maxSpeedKmh: 64,
    throttleRise: 2.2,
    brakeImpulse: 360,
    highSpeedSteerDeg: 11.5,
    steerResponse: 3.4,
    suspensionStiffness: 38,
    suspensionCompression: 4.2,
    suspensionRelaxation: 5.0,
    maxSuspensionTravel: 0.22,
    maxSuspensionForce: 76000,
    frictionSlip: 3.5,
    sideFrictionStiffness: 1.35,
    bodyRollGain: 0.015,
    bodyPitchGain: 0.010,
    bodyMotionResponse: 6.4,
    cameraDistance: 11.0,
    cameraSpring: 52,
    cameraLookSpring: 68,
    cameraSpeedPullback: 3.0,
    cameraFovBoost: 6.5,
  },
}

export const BUS = {
  massKg: 12000,
  wheelbaseM: 5.45,
  trackWidthM: 2.02,
  wheelRadiusM: 0.48,
  fixedDt: 1 / 60,
  maxSubsteps: 5,
  start: { x: 0, y: 1.02, z: 0 },
} as const

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
  surface: "asphalt" | "wet" | "laterite" | "rough"
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
  wheels: Array.from({ length: 4 }, () => ({
    contact: false,
    suspensionLength: 0,
    suspensionForce: 0,
    forwardImpulse: 0,
    sideImpulse: 0,
  })),
}
