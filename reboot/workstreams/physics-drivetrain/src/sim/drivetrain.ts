export type ShiftEvent = {
  serial: number
  fromGear: number
  toGear: number
  reason: "upshift" | "downshift" | "kickdown"
}

export type DrivetrainState = {
  gear: number
  pendingGear: number
  normalizedRpm: number
  load: number
  shiftRemaining: number
  shiftDuration: number
  shiftSerial: number
  lastShiftEvent: ShiftEvent | null
}

export type DrivetrainOutput = {
  gear: number
  normalizedRpm: number
  load: number
  torqueMultiplier: number
  shifting: boolean
  shiftProgress: number
  shiftEvent: ShiftEvent | null
}

const IDLE_RPM_NORM = 0.18
const GEAR_MIN_KMH = [0, 0, 9.5, 19, 29.5, 40, 50]
const GEAR_MAX_KMH = [0, 15, 27, 39.5, 52, 62, 72]
const GEAR_TORQUE = [0, 1.48, 1.27, 1.10, 0.99, 0.95, 0.89]
const UPSHIFT_RPM = [0, 0.88, 0.89, 0.90, 0.91, 0.90, 2]

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function createDrivetrainState(): DrivetrainState {
  return {
    gear: 1,
    pendingGear: 1,
    normalizedRpm: IDLE_RPM_NORM,
    load: 0,
    shiftRemaining: 0,
    shiftDuration: 0.32,
    shiftSerial: 0,
    lastShiftEvent: null,
  }
}

export function resetDrivetrain(state: DrivetrainState) {
  Object.assign(state, createDrivetrainState())
}

function rpmForGear(speedKmh: number, gear: number) {
  const min = GEAR_MIN_KMH[gear] ?? 0
  const max = GEAR_MAX_KMH[gear] ?? 72
  const band = Math.max(1, max - min)
  return Math.max(IDLE_RPM_NORM, Math.min(1.08, IDLE_RPM_NORM + ((speedKmh - min) / band) * (1 - IDLE_RPM_NORM)))
}

function beginShift(state: DrivetrainState, toGear: number, durationSec: number, reason: ShiftEvent["reason"]) {
  const clampedGear = Math.max(1, Math.min(6, toGear))
  if (clampedGear === state.gear || state.shiftRemaining > 0) return null
  state.shiftDuration = Math.max(0.25, Math.min(0.40, durationSec))
  state.shiftRemaining = state.shiftDuration
  state.pendingGear = clampedGear
  state.shiftSerial += 1
  const event: ShiftEvent = { serial: state.shiftSerial, fromGear: state.gear, toGear: clampedGear, reason }
  state.lastShiftEvent = event
  return event
}

export function stepDrivetrain(
  state: DrivetrainState,
  dt: number,
  speedKmh: number,
  throttle: number,
  shiftDurationMs: number,
): DrivetrainOutput {
  const speed = Math.max(0, speedKmh)
  const pedal = clamp01(throttle)
  let shiftEvent: ShiftEvent | null = null

  if (state.shiftRemaining > 0) {
    state.shiftRemaining = Math.max(0, state.shiftRemaining - dt)
    if (state.shiftRemaining === 0) state.gear = state.pendingGear
  } else {
    state.normalizedRpm = rpmForGear(speed, state.gear)
    const kickdown = state.gear > 1 && pedal > 0.78 && state.normalizedRpm < 0.29
    const downshift = state.gear > 1 && state.normalizedRpm < (pedal > 0.35 ? 0.27 : 0.24)
    const upshift = state.gear < 6 && state.normalizedRpm >= (UPSHIFT_RPM[state.gear] ?? 0.92)
    const shiftSeconds = shiftDurationMs / 1000
    if (kickdown) shiftEvent = beginShift(state, state.gear - 1, shiftSeconds, "kickdown")
    else if (downshift) shiftEvent = beginShift(state, state.gear - 1, shiftSeconds, "downshift")
    else if (upshift) shiftEvent = beginShift(state, state.gear + 1, shiftSeconds, "upshift")
  }

  state.normalizedRpm = rpmForGear(speed, state.gear)
  const rpmArc = Math.sin(Math.PI * clamp01((state.normalizedRpm - IDLE_RPM_NORM) / (1 - IDLE_RPM_NORM)))
  const engineCurve = 0.76 + 0.32 * Math.max(0, rpmArc)
  state.load = clamp01(pedal * (0.72 + 0.36 * (1 - clamp01(state.normalizedRpm))))
  const shifting = state.shiftRemaining > 0
  const shiftProgress = shifting ? 1 - state.shiftRemaining / Math.max(0.001, state.shiftDuration) : 0
  const torqueMultiplier = shifting ? 0 : (GEAR_TORQUE[state.gear] ?? 0.78) * engineCurve

  return {
    gear: state.gear,
    normalizedRpm: state.normalizedRpm,
    load: state.load,
    torqueMultiplier,
    shifting,
    shiftProgress,
    shiftEvent,
  }
}
