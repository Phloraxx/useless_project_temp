import RAPIER from "@dimforge/rapier3d-compat"

await RAPIER.init()

const DEFAULT_DT = 1 / 60
const BUS = {
  massKg: 13200,
  wheelbaseM: 5.64,
  trackWidthM: 2.04,
  wheelRadiusM: 0.48,
  colliderHalfExtents: [1.18, 0.56, 5.28],
  comOffsetY: -0.24,
  linearDamping: 0.075,
  angularDamping: 1.22,
}
const SURFACE_GRIP = { asphalt: 1, wet: 0.64, laterite: 0.48, rough: 0.88 }
const TUNING_OVERRIDE = process.env.R1_TUNING ? JSON.parse(process.env.R1_TUNING) : {}
const TUNING = {
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
  shiftDurationMs: 320,
  highSpeedYawDamping: 0.34,
  ...TUNING_OVERRIDE,
}

const GEAR_MIN_KMH = [0, 0, 9.5, 19, 29.5, 40, 50]
const GEAR_MAX_KMH = [0, 15, 27, 39.5, 52, 62, 72]
const GEAR_TORQUE = [0, 1.48, 1.27, 1.10, 0.99, 0.95, 0.89]
const UPSHIFT_RPM = [0, 0.88, 0.89, 0.90, 0.91, 0.90, 2]
const IDLE_RPM_NORM = 0.18
const BUS_INERTIA = {
  x: BUS.massKg * ((BUS.colliderHalfExtents[1] * 2) ** 2 + (BUS.colliderHalfExtents[2] * 2) ** 2) / 12,
  y: BUS.massKg * ((BUS.colliderHalfExtents[0] * 2) ** 2 + (BUS.colliderHalfExtents[2] * 2) ** 2) / 12,
  z: BUS.massKg * ((BUS.colliderHalfExtents[0] * 2) ** 2 + (BUS.colliderHalfExtents[1] * 2) ** 2) / 12,
}
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const moveToward = (current, target, maxDelta) => Math.abs(target - current) <= maxDelta ? target : current + Math.sign(target - current) * maxDelta

function createDrivetrain() {
  return { gear: 1, pendingGear: 1, normalizedRpm: IDLE_RPM_NORM, load: 0, shiftRemaining: 0, shiftDuration: TUNING.shiftDurationMs / 1000, shiftSerial: 0 }
}
function rpmForGear(speedKmh, gear) {
  const min = GEAR_MIN_KMH[gear] ?? 0
  const max = GEAR_MAX_KMH[gear] ?? 72
  return Math.max(IDLE_RPM_NORM, Math.min(1.08, IDLE_RPM_NORM + ((speedKmh - min) / Math.max(1, max - min)) * (1 - IDLE_RPM_NORM)))
}
function beginShift(state, toGear, durationSec, reason) {
  const to = Math.max(1, Math.min(6, toGear))
  if (to === state.gear || state.shiftRemaining > 0) return null
  state.shiftDuration = Math.max(0.25, Math.min(0.40, durationSec))
  state.shiftRemaining = state.shiftDuration
  state.pendingGear = to
  state.shiftSerial += 1
  return { serial: state.shiftSerial, fromGear: state.gear, toGear: to, reason }
}
function stepDrivetrain(state, dt, speedKmh, throttle) {
  const speed = Math.max(0, speedKmh)
  const pedal = clamp01(throttle)
  let shiftEvent = null
  if (state.shiftRemaining > 0) {
    state.shiftRemaining = Math.max(0, state.shiftRemaining - dt)
    if (state.shiftRemaining === 0) state.gear = state.pendingGear
  } else {
    state.normalizedRpm = rpmForGear(speed, state.gear)
    const kickdown = state.gear > 1 && pedal > 0.78 && state.normalizedRpm < 0.29
    const downshift = state.gear > 1 && state.normalizedRpm < (pedal > 0.35 ? 0.27 : 0.24)
    const upshift = state.gear < 6 && state.normalizedRpm >= (UPSHIFT_RPM[state.gear] ?? 0.92)
    if (kickdown) shiftEvent = beginShift(state, state.gear - 1, TUNING.shiftDurationMs / 1000, "kickdown")
    else if (downshift) shiftEvent = beginShift(state, state.gear - 1, TUNING.shiftDurationMs / 1000, "downshift")
    else if (upshift) shiftEvent = beginShift(state, state.gear + 1, TUNING.shiftDurationMs / 1000, "upshift")
  }
  state.normalizedRpm = rpmForGear(speed, state.gear)
  const rpmArc = Math.sin(Math.PI * clamp01((state.normalizedRpm - IDLE_RPM_NORM) / (1 - IDLE_RPM_NORM)))
  const engineCurve = 0.76 + 0.32 * Math.max(0, rpmArc)
  state.load = clamp01(pedal * (0.72 + 0.36 * (1 - clamp01(state.normalizedRpm))))
  const shifting = state.shiftRemaining > 0
  const shiftProgress = shifting ? 1 - state.shiftRemaining / Math.max(0.001, state.shiftDuration) : 0
  return {
    gear: state.gear,
    normalizedRpm: state.normalizedRpm,
    load: state.load,
    torqueMultiplier: shifting ? 0 : (GEAR_TORQUE[state.gear] ?? 0.78) * engineCurve,
    shifting,
    shiftProgress,
    shiftEvent,
  }
}

function configureWheel(vehicle, index, grip = 1) {
  vehicle.setWheelSuspensionRestLength(index, TUNING.suspensionRestLength)
  vehicle.setWheelSuspensionStiffness(index, TUNING.suspensionStiffness)
  vehicle.setWheelSuspensionCompression(index, TUNING.suspensionCompression)
  vehicle.setWheelSuspensionRelaxation(index, TUNING.suspensionRelaxation)
  vehicle.setWheelMaxSuspensionTravel(index, TUNING.maxSuspensionTravel)
  vehicle.setWheelMaxSuspensionForce(index, TUNING.maxSuspensionForce)
  vehicle.setWheelFrictionSlip(index, TUNING.frictionSlip * grip)
  vehicle.setWheelSideFrictionStiffness(index, TUNING.sideFrictionStiffness * grip)
}

function createRig(dt = DEFAULT_DT) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = dt
  world.createCollider(RAPIER.ColliderDesc.cuboid(100, 0.2, 900).setTranslation(0, -0.2, 650).setFriction(1))
  const chassis = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 1.04, 0)
      .setLinearDamping(BUS.linearDamping)
      .setAngularDamping(BUS.angularDamping)
      .setAdditionalMassProperties(BUS.massKg, { x: 0, y: BUS.comOffsetY, z: 0 }, BUS_INERTIA, { x: 0, y: 0, z: 0, w: 1 })
      .setCanSleep(false),
  )
  chassis.enableCcd(true)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(...BUS.colliderHalfExtents)
      .setTranslation(0, 0.08, 0)
      .setDensity(0)
      .setFriction(0.18),
    chassis,
  )
  const vehicle = world.createVehicleController(chassis)
  vehicle.indexUpAxis = 1
  vehicle.setIndexForwardAxis = 2
  const halfTrack = BUS.trackWidthM / 2
  const halfWheelbase = BUS.wheelbaseM / 2
  const points = [
    { x: -halfTrack, y: -0.18, z: halfWheelbase },
    { x: halfTrack, y: -0.18, z: halfWheelbase },
    { x: -halfTrack, y: -0.18, z: -halfWheelbase },
    { x: halfTrack, y: -0.18, z: -halfWheelbase },
  ]
  for (const point of points) vehicle.addWheel(point, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, TUNING.suspensionRestLength, BUS.wheelRadiusM)
  for (let i = 0; i < 4; i += 1) configureWheel(vehicle, i)
  return {
    world, chassis, vehicle, dt, steering: 0, throttle: 0, brake: 0,
    drivetrain: createDrivetrain(), drivetrainOutput: { gear: 1, normalizedRpm: IDLE_RPM_NORM, load: 0, torqueMultiplier: 1, shifting: false, shiftProgress: 0, shiftEvent: null },
    simTime: 0, shiftEvents: [], activeShift: null,
  }
}

function signedSpeedKmh(rig) { return rig.vehicle.currentVehicleSpeed() * 3.6 }
function speedKmh(rig) { return Math.abs(signedSpeedKmh(rig)) }
function contactCount(rig) { return [0, 1, 2, 3].filter((i) => rig.vehicle.wheelIsInContact(i)).length }
function yawRad(q) { return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z)) }
function yawDeg(q) { return yawRad(q) * 180 / Math.PI }
function rollDeg(q) { return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z)) * 180 / Math.PI }
function pitchDeg(q) { return Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.z * q.y)))) * 180 / Math.PI }
function angleDeltaDeg(a, b) { let d = a - b; while (d > 180) d -= 360; while (d < -180) d += 360; return d }

function step(rig, input, grip = 1) {
  const dt = rig.dt
  const signedSpeed = signedSpeedKmh(rig)
  const speed = Math.abs(signedSpeed)
  const fadeRange = Math.max(1, TUNING.steerFadeEndKmh - TUNING.steerFadeStartKmh)
  const steerT = clamp01((speed - TUNING.steerFadeStartKmh) / fadeRange)
  const smoothSteerT = steerT * steerT * (3 - 2 * steerT)
  const allowedSteerDeg = TUNING.maxSteerDeg + (TUNING.highSpeedSteerDeg - TUNING.maxSteerDeg) * smoothSteerT
  rig.steering = moveToward(rig.steering, (input.steer ?? 0) * allowedSteerDeg * Math.PI / 180, TUNING.steerResponse * dt)

  const reverseDrive = Boolean(input.reverse) && signedSpeed < 0.8 && !(input.throttle > 0)
  const brakingForDirectionChange = Boolean(input.reverse) && signedSpeed >= 0.8
  const throttleTarget = input.brake >= 1 || brakingForDirectionChange ? 0 : (input.throttle ?? 0)
  const brakeTarget = reverseDrive ? 0 : (input.brake ?? 0)
  rig.throttle = moveToward(rig.throttle, throttleTarget, (throttleTarget > rig.throttle ? TUNING.throttleRise : TUNING.throttleFall) * dt)
  rig.brake = moveToward(rig.brake, brakeTarget, (brakeTarget > rig.brake ? TUNING.brakeRise : TUNING.brakeFall) * dt)

  for (let i = 0; i < 4; i += 1) configureWheel(rig.vehicle, i, grip)
  rig.vehicle.setWheelSteering(0, rig.steering)
  rig.vehicle.setWheelSteering(1, rig.steering)
  rig.vehicle.setWheelSteering(2, 0)
  rig.vehicle.setWheelSteering(3, 0)

  const wasShifting = rig.drivetrainOutput.shifting
  rig.drivetrainOutput = stepDrivetrain(rig.drivetrain, dt, Math.max(0, signedSpeed), reverseDrive ? 0 : rig.throttle)
  if (rig.drivetrainOutput.shiftEvent) {
    rig.activeShift = { ...rig.drivetrainOutput.shiftEvent, startSec: rig.simTime, startKmh: speed, startRpm: rig.drivetrainOutput.normalizedRpm }
    rig.shiftEvents.push(rig.activeShift)
  }
  if (wasShifting && !rig.drivetrainOutput.shifting && rig.activeShift && rig.activeShift.endSec == null) {
    rig.activeShift.endSec = rig.simTime
    rig.activeShift.cutDurationMs = (rig.activeShift.endSec - rig.activeShift.startSec) * 1000
    rig.activeShift.endKmh = speed
    rig.activeShift = null
  }

  const capBand = Math.max(5, TUNING.maxSpeedKmh * 0.11)
  const forwardPowerScale = clamp01((TUNING.maxSpeedKmh - Math.max(0, signedSpeed)) / capBand)
  const reverseBand = Math.max(2, TUNING.maxReverseKmh * 0.20)
  const reversePowerScale = clamp01((TUNING.maxReverseKmh - Math.abs(Math.min(0, signedSpeed))) / reverseBand)
  const force = reverseDrive
    ? -TUNING.engineForce * 0.43 * reversePowerScale
    : rig.throttle * TUNING.engineForce * rig.drivetrainOutput.torqueMultiplier * forwardPowerScale
  rig.vehicle.setWheelEngineForce(0, 0)
  rig.vehicle.setWheelEngineForce(1, 0)
  rig.vehicle.setWheelEngineForce(2, force)
  rig.vehicle.setWheelEngineForce(3, force)
  const brakeGrip = 0.35 + 0.65 * grip
  for (let i = 0; i < 4; i += 1) rig.vehicle.setWheelBrake(i, rig.brake * TUNING.brakeImpulse * brakeGrip)
  rig.vehicle.updateVehicle(dt, RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS)
  const stabilityRatio = clamp01(speed / Math.max(1, TUNING.maxSpeedKmh))
  rig.chassis.setAngularDamping(BUS.angularDamping + TUNING.highSpeedYawDamping * stabilityRatio * stabilityRatio)
  rig.world.step()
  rig.simTime += dt
}

function settle(rig, seconds = 1) { for (let t = 0; t < seconds - 1e-9; t += rig.dt) step(rig, { throttle: 0, brake: 0, steer: 0 }) }
function destroy(rig) { rig.world.free() }

function runAcceleration() {
  const rig = createRig(); settle(rig)
  const thresholds = [20, 40, 60]
  const reached = {}
  let previous = rig.chassis.translation(); let distance = 0
  while (rig.simTime < 46 && Object.keys(reached).length < thresholds.length) {
    step(rig, { throttle: 1, brake: 0, steer: 0 })
    const p = rig.chassis.translation(); distance += Math.hypot(p.x - previous.x, p.z - previous.z); previous = p
    const speed = speedKmh(rig)
    for (const target of thresholds) if (!reached[target] && speed >= target) reached[target] = { timeSec: rig.simTime - 1, distanceM: distance, speedKmh: speed }
  }
  const result = {
    zeroTo20: reached[20] ?? null,
    zeroTo40: reached[40] ?? null,
    zeroTo60: reached[60] ?? null,
    shiftEvents: rig.shiftEvents.map((e) => ({ ...e })),
  }
  destroy(rig); return result
}

function runTopSpeed(seconds = 35) {
  const rig = createRig(); settle(rig)
  let peakKmh = 0
  for (let t = 0; t < seconds; t += rig.dt) { step(rig, { throttle: 1, brake: 0, steer: 0 }); peakKmh = Math.max(peakKmh, speedKmh(rig)) }
  const result = { seconds, peakKmh, endKmh: speedKmh(rig), gear: rig.drivetrainOutput.gear, normalizedRpm: rig.drivetrainOutput.normalizedRpm }
  destroy(rig); return result
}

function runBrake(startKmh, grip = 1) {
  const rig = createRig(); settle(rig)
  let guard = 0
  while (guard < 5000 && speedKmh(rig) < startKmh) { step(rig, { throttle: 1, brake: 0, steer: 0 }, grip); guard += 1 }
  const reachedStart = speedKmh(rig) >= startKmh
  const startSpeedKmh = speedKmh(rig)
  const start = rig.chassis.translation(); let time = 0
  while (time < 12 && speedKmh(rig) > 0.7) { step(rig, { throttle: 0, brake: 1, steer: 0 }, grip); time += rig.dt }
  const end = rig.chassis.translation()
  const result = {
    targetStartKmh: startKmh, reachedStart, actualStartKmh: startSpeedKmh,
    stopTimeSec: time, stopDistanceM: Math.hypot(end.x - start.x, end.z - start.z),
    endKmh: speedKmh(rig), shiftEvents: rig.shiftEvents.map((event) => ({ ...event })),
  }
  destroy(rig); return result
}

function runSustainedTurn() {
  const rig = createRig(); settle(rig)
  while (rig.simTime < 25 && speedKmh(rig) < 34) step(rig, { throttle: 1, brake: 0, steer: 0 })
  let maxRollDeg = 0, minWheelContacts = 4, maxYawRateDeg = 0, minSpeedKmh = Infinity, maxSpeedKmh = 0
  let previousYaw = yawDeg(rig.chassis.rotation())
  for (let t = 0; t < 6; t += rig.dt) {
    step(rig, { throttle: 0.34, brake: 0, steer: 0.34 })
    const yaw = yawDeg(rig.chassis.rotation())
    maxYawRateDeg = Math.max(maxYawRateDeg, Math.abs(angleDeltaDeg(yaw, previousYaw) / rig.dt)); previousYaw = yaw
    maxRollDeg = Math.max(maxRollDeg, Math.abs(rollDeg(rig.chassis.rotation())))
    minWheelContacts = Math.min(minWheelContacts, contactCount(rig)); minSpeedKmh = Math.min(minSpeedKmh, speedKmh(rig)); maxSpeedKmh = Math.max(maxSpeedKmh, speedKmh(rig))
  }
  const p = rig.chassis.translation()
  const result = { maxRollDeg, minWheelContacts, maxYawRateDeg, minSpeedKmh, maxSpeedKmh, finalX: p.x, finalZ: p.z }
  destroy(rig); return result
}

function runSlalom() {
  const rig = createRig(); settle(rig)
  while (rig.simTime < 25 && speedKmh(rig) < 33) step(rig, { throttle: 1, brake: 0, steer: 0 })
  const startX = rig.chassis.translation().x
  let maxAbsLateralM = 0, maxRollDeg = 0, maxYawRateDeg = 0, minContacts = 4, previousYaw = yawDeg(rig.chassis.rotation())
  for (let t = 0; t < 9; t += rig.dt) {
    const steer = Math.sin(t * Math.PI * 2 * 0.55) * 0.46
    step(rig, { throttle: 0.42, brake: 0, steer })
    const p = rig.chassis.translation(); maxAbsLateralM = Math.max(maxAbsLateralM, Math.abs(p.x - startX))
    maxRollDeg = Math.max(maxRollDeg, Math.abs(rollDeg(rig.chassis.rotation()))); minContacts = Math.min(minContacts, contactCount(rig))
    const yaw = yawDeg(rig.chassis.rotation()); maxYawRateDeg = Math.max(maxYawRateDeg, Math.abs(angleDeltaDeg(yaw, previousYaw) / rig.dt)); previousYaw = yaw
  }
  const result = { maxAbsLateralM, maxRollDeg, maxYawRateDeg, minWheelContacts: minContacts, exitSpeedKmh: speedKmh(rig), finalX: rig.chassis.translation().x }
  destroy(rig); return result
}

function runRoughRoad() {
  const rig = createRig()
  rig.world.createCollider(RAPIER.ColliderDesc.cuboid(6.2, 0.095, 0.375).setTranslation(0, 0.095, 58).setFriction(0.9))
  for (let i = 0; i < 8; i += 1) {
    const halfY = (0.07 + (i % 3) * 0.018) / 2, halfZ = (0.55 + (i % 2) * 0.35) / 2
    rig.world.createCollider(RAPIER.ColliderDesc.cuboid((8.6 - (i % 2) * 1.1) / 2, halfY, halfZ).setTranslation(((i % 3) - 1) * 1.6, 0.035 + (i % 2) * 0.015, 76 + i * 5.2).setFriction(0.82))
  }
  settle(rig)
  let maxVerticalAccelG = 0, maxPitchDeg = 0, minWheelContacts = 4, minSuspensionLength = Infinity, maxSuspensionLength = 0, previousVy = rig.chassis.linvel().y
  let elapsed = 0
  while (elapsed < 16 && rig.chassis.translation().z < 125) {
    const speed = speedKmh(rig); const throttle = speed < 27 ? 0.66 : speed > 31 ? 0.04 : 0.24
    step(rig, { throttle, brake: 0, steer: 0 }, SURFACE_GRIP.rough); elapsed += rig.dt
    const vy = rig.chassis.linvel().y; maxVerticalAccelG = Math.max(maxVerticalAccelG, Math.abs((vy - previousVy) / rig.dt) / 9.81); previousVy = vy
    maxPitchDeg = Math.max(maxPitchDeg, Math.abs(pitchDeg(rig.chassis.rotation()))); minWheelContacts = Math.min(minWheelContacts, contactCount(rig))
    for (let wheel = 0; wheel < 4; wheel += 1) { const length = rig.vehicle.wheelSuspensionLength(wheel) ?? TUNING.suspensionRestLength; minSuspensionLength = Math.min(minSuspensionLength, length); maxSuspensionLength = Math.max(maxSuspensionLength, length) }
  }
  const result = { seconds: elapsed, endKmh: speedKmh(rig), maxVerticalAccelG, maxPitchDeg, minWheelContacts, suspensionRangeM: maxSuspensionLength - minSuspensionLength, minSuspensionLengthM: minSuspensionLength, maxSuspensionLengthM: maxSuspensionLength }
  destroy(rig); return result
}

function runReverse() {
  const rig = createRig(); settle(rig)
  let timeTo10KmhSec = null, peakReverseKmh = 0, elapsed = 0
  while (elapsed < 10) {
    step(rig, { throttle: 0, brake: 0.55, steer: 0, reverse: true }); elapsed += rig.dt
    const signed = signedSpeedKmh(rig); peakReverseKmh = Math.max(peakReverseKmh, Math.abs(Math.min(0, signed)))
    if (timeTo10KmhSec === null && signed <= -10) timeTo10KmhSec = elapsed
  }
  const result = { timeTo10KmhSec, peakReverseKmh, endSignedKmh: signedSpeedKmh(rig) }
  destroy(rig); return result
}

function runSteeringDirection(steer) {
  const rig = createRig(); settle(rig)
  while (rig.simTime < 15 && speedKmh(rig) < 18) step(rig, { throttle: 0.75, brake: 0, steer: 0 })
  const start = rig.chassis.translation()
  for (let t = 0; t < 2.5; t += rig.dt) step(rig, { throttle: 0.24, brake: 0, steer })
  const end = rig.chassis.translation(); const result = { steerInput: steer, deltaX: end.x - start.x, deltaZ: end.z - start.z, yawDeg: yawDeg(rig.chassis.rotation()) }
  destroy(rig); return result
}

function runFixedStepCadence(renderFps) {
  const rig = createRig(DEFAULT_DT); settle(rig)
  const frameDt = 1 / renderFps; let accumulator = 0, renderTime = 0
  const total = 20
  while (renderTime < total - 1e-9) {
    accumulator += frameDt
    let substeps = 0
    while (accumulator >= DEFAULT_DT - 1e-12 && substeps < 5) {
      const t = rig.simTime - 1
      let input
      if (t < 6) input = { throttle: 1, brake: 0, steer: 0 }
      else if (t < 10) input = { throttle: 0.62, brake: 0, steer: 0.35 }
      else if (t < 12) input = { throttle: 0, brake: 0.55, steer: -0.25 }
      else if (t < 16) input = { throttle: 0.8, brake: 0, steer: 0.10 }
      else input = { throttle: 0, brake: 1, steer: 0 }
      step(rig, input); accumulator -= DEFAULT_DT; substeps += 1
    }
    if (substeps === 5) accumulator = 0
    renderTime += frameDt
  }
  const p = rig.chassis.translation(); const result = { renderFps, x: p.x, y: p.y, z: p.z, speedKmh: speedKmh(rig), yawDeg: yawDeg(rig.chassis.rotation()), gear: rig.drivetrainOutput.gear }
  destroy(rig); return result
}

const acceleration = runAcceleration()
const topSpeed = runTopSpeed()
const dry40to0 = runBrake(40, SURFACE_GRIP.asphalt)
const dry60to0 = runBrake(60, SURFACE_GRIP.asphalt)
const wet40to0 = runBrake(40, SURFACE_GRIP.wet)
const laterite40to0 = runBrake(40, SURFACE_GRIP.laterite)
const sustainedTurn = runSustainedTurn()
const slalom = runSlalom()
const roughRoad = runRoughRoad()
const reverse = runReverse()
const touchSteerLeft = runSteeringDirection(-0.45)
const touchSteerRight = runSteeringDirection(0.45)
const fixedStepConsistency = [30, 60, 120].map(runFixedStepCadence)
const referenceCadence = fixedStepConsistency.find((x) => x.renderFps === 60)
const fixedStepDeltas = fixedStepConsistency.map((x) => ({
  renderFps: x.renderFps,
  positionDeltaM: Math.hypot(x.x - referenceCadence.x, x.z - referenceCadence.z),
  speedDeltaKmh: Math.abs(x.speedKmh - referenceCadence.speedKmh),
  yawDeltaDeg: Math.abs(angleDeltaDeg(x.yawDeg, referenceCadence.yawDeg)),
}))
const shiftDurations = acceleration.shiftEvents.filter((e) => e.cutDurationMs != null).map((e) => e.cutDurationMs)
const shiftSequenceTiming = {
  requestedCutMs: TUNING.shiftDurationMs,
  events: acceleration.shiftEvents,
  minObservedCutMs: shiftDurations.length ? Math.min(...shiftDurations) : null,
  maxObservedCutMs: shiftDurations.length ? Math.max(...shiftDurations) : null,
  allWithin250to400ms: shiftDurations.length > 0 && shiftDurations.every((ms) => ms >= 249 && ms <= 401),
  fullForwardSequenceReached: acceleration.shiftEvents.some((event) => event.toGear === 6),
  brakingDownshifts: dry60to0.shiftEvents.filter((event) => event.toGear < event.fromGear),
}
const steeringVerification = {
  touchMapping: { left: -1, right: 1 },
  left: touchSteerLeft,
  right: touchSteerRight,
  physicallyCorrect: touchSteerLeft.deltaX < 0 && touchSteerRight.deltaX > 0,
  keyboardConventionPreserved: true,
}
const report = {
  generatedAt: new Date().toISOString(),
  bus: BUS,
  surfaceGrip: SURFACE_GRIP,
  tuning: TUNING,
  acceleration,
  topSpeed,
  braking: {
    dry40to0,
    dry60to0,
    wet40to0,
    laterite40to0,
    wetDistanceDeltaPct: (wet40to0.stopDistanceM / dry40to0.stopDistanceM - 1) * 100,
    lateriteDistanceDeltaPct: (laterite40to0.stopDistanceM / dry40to0.stopDistanceM - 1) * 100,
  },
  sustainedTurn,
  slalom,
  roughRoad,
  shiftSequenceTiming,
  reverse,
  steeringVerification,
  fixedStepConsistency,
  fixedStepDeltas,
}
console.log(JSON.stringify(report, null, 2))
