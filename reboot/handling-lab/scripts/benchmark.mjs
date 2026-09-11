import RAPIER from "@dimforge/rapier3d-compat"

await RAPIER.init()

const DT = 1 / 60
const BUS = {
  massKg: 12000,
  wheelbaseM: 5.45,
  trackWidthM: 2.02,
  wheelRadiusM: 0.48,
}
const TUNING_OVERRIDE = process.env.R1_TUNING ? JSON.parse(process.env.R1_TUNING) : {}
const TUNING = {
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
  ...TUNING_OVERRIDE,
}
function moveToward(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target
  return current + Math.sign(target - current) * maxDelta
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

function createRig() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = DT
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(100, 0.2, 700)
      .setTranslation(0, -0.2, 500)
      .setFriction(1),
  )

  const chassis = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 1.02, 0)
      .setLinearDamping(0.08)
      .setAngularDamping(1.15)
      .setCanSleep(false),
  )
  chassis.enableCcd(true)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(1.16, 0.55, 5.18)
      .setTranslation(0, 0.08, 0)
      .setMass(BUS.massKg)
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
  for (const point of points) {
    vehicle.addWheel(point, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, TUNING.suspensionRestLength, BUS.wheelRadiusM)
  }
  for (let i = 0; i < 4; i += 1) configureWheel(vehicle, i)
  return { world, chassis, vehicle, steering: 0, throttle: 0, brake: 0 }
}

function step(rig, input, grip = 1) {
  const signedSpeedKmh = rig.vehicle.currentVehicleSpeed() * 3.6
  const speedKmh = Math.abs(signedSpeedKmh)
  const fadeRange = Math.max(1, TUNING.steerFadeEndKmh - TUNING.steerFadeStartKmh)
  const steerT = Math.max(0, Math.min(1, (speedKmh - TUNING.steerFadeStartKmh) / fadeRange))
  const smoothSteerT = steerT * steerT * (3 - 2 * steerT)
  const allowedSteerDeg = TUNING.maxSteerDeg + (TUNING.highSpeedSteerDeg - TUNING.maxSteerDeg) * smoothSteerT
  const requestedSteer = input.steer * allowedSteerDeg * Math.PI / 180
  rig.steering = moveToward(rig.steering, requestedSteer, TUNING.steerResponse * DT)
  const reverseDrive = Boolean(input.reverse) && signedSpeedKmh < 0.8 && !input.throttle
  const brakingForDirectionChange = Boolean(input.reverse) && signedSpeedKmh >= 0.8
  const throttleTarget = input.brake >= 1 || brakingForDirectionChange ? 0 : input.throttle
  const brakeTarget = reverseDrive ? 0 : input.brake
  rig.throttle = moveToward(rig.throttle, throttleTarget, (throttleTarget > rig.throttle ? TUNING.throttleRise : TUNING.throttleFall) * DT)
  rig.brake = moveToward(rig.brake, brakeTarget, (brakeTarget > rig.brake ? TUNING.brakeRise : TUNING.brakeFall) * DT)

  for (let i = 0; i < 4; i += 1) configureWheel(rig.vehicle, i, grip)
  rig.vehicle.setWheelSteering(0, rig.steering)
  rig.vehicle.setWheelSteering(1, rig.steering)
  rig.vehicle.setWheelSteering(2, 0)
  rig.vehicle.setWheelSteering(3, 0)

  const capBand = Math.max(4, TUNING.maxSpeedKmh * 0.12)
  const forwardPowerScale = Math.max(0, Math.min(1, (TUNING.maxSpeedKmh - Math.max(0, signedSpeedKmh)) / capBand))
  const reverseBand = Math.max(2, TUNING.maxReverseKmh * 0.20)
  const reversePowerScale = Math.max(0, Math.min(1, (TUNING.maxReverseKmh - Math.abs(Math.min(0, signedSpeedKmh))) / reverseBand))
  const force = reverseDrive ? -TUNING.engineForce * 0.46 * reversePowerScale : rig.throttle * TUNING.engineForce * forwardPowerScale
  rig.vehicle.setWheelEngineForce(0, 0)
  rig.vehicle.setWheelEngineForce(1, 0)
  rig.vehicle.setWheelEngineForce(2, force)
  rig.vehicle.setWheelEngineForce(3, force)
  const brakeGrip = 0.55 + 0.45 * grip
  for (let i = 0; i < 4; i += 1) rig.vehicle.setWheelBrake(i, rig.brake * TUNING.brakeImpulse * brakeGrip)
  rig.vehicle.updateVehicle(DT, RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS)
  rig.world.step()
}

function settle(rig, seconds = 1) {
  for (let i = 0; i < seconds / DT; i += 1) step(rig, { throttle: 0, brake: 0, steer: 0 })
}

function speedKmh(rig) {
  return Math.abs(rig.vehicle.currentVehicleSpeed()) * 3.6
}
function runAcceleration() {
  const rig = createRig()
  settle(rig)
  let time = 0
  let distance = 0
  let previousZ = rig.chassis.translation().z
  while (time < 30 && speedKmh(rig) < 40) {
    step(rig, { throttle: 1, brake: 0, steer: 0 })
    time += DT
    const z = rig.chassis.translation().z
    distance += Math.abs(z - previousZ)
    previousZ = z
  }
  const result = { timeTo40Sec: time, distanceTo40M: distance, reachedKmh: speedKmh(rig) }
  rig.world.free()
  return result
}

function runTopSpeed(seconds = 25) {
  const rig = createRig()
  settle(rig)
  let peakKmh = 0
  for (let i = 0; i < seconds / DT; i += 1) {
    step(rig, { throttle: 1, brake: 0, steer: 0 })
    peakKmh = Math.max(peakKmh, speedKmh(rig))
  }
  const result = { seconds, peakKmh, endKmh: speedKmh(rig) }
  rig.world.free()
  return result
}

function runBrake(grip = 1) {
  const rig = createRig()
  settle(rig)
  let guard = 0
  while (guard < 2400 && speedKmh(rig) < 40) {
    step(rig, { throttle: 1, brake: 0, steer: 0 }, grip)
    guard += 1
  }
  const start = rig.chassis.translation()
  let time = 0
  while (time < 10 && speedKmh(rig) > 0.7) {
    step(rig, { throttle: 0, brake: 1, steer: 0 }, grip)
    time += DT
  }
  const end = rig.chassis.translation()
  const distance = Math.hypot(end.x - start.x, end.z - start.z)
  const result = { stopTimeSec: time, stopDistanceM: distance, endKmh: speedKmh(rig) }
  rig.world.free()
  return result
}
function rollDeg(q) {
  const sinr = 2 * (q.w * q.z + q.x * q.y)
  const cosr = 1 - 2 * (q.y * q.y + q.z * q.z)
  return Math.atan2(sinr, cosr) * 180 / Math.PI
}
function pitchDeg(q) {
  const sinp = 2 * (q.w * q.x - q.z * q.y)
  return Math.asin(Math.max(-1, Math.min(1, sinp))) * 180 / Math.PI
}

function runRideComfort() {
  const rig = createRig()
  rig.world.createCollider(
    RAPIER.ColliderDesc.cuboid(6.2, 0.095, 0.375).setTranslation(0, 0.095, 58).setFriction(0.9),
  )
  for (let i = 0; i < 8; i += 1) {
    const halfY = (0.07 + (i % 3) * 0.018) / 2
    const halfZ = (0.55 + (i % 2) * 0.35) / 2
    rig.world.createCollider(
      RAPIER.ColliderDesc.cuboid((8.6 - (i % 2) * 1.1) / 2, halfY, halfZ)
        .setTranslation(((i % 3) - 1) * 1.6, 0.035 + (i % 2) * 0.015, 76 + i * 5.2)
        .setFriction(0.82),
    )
  }
  settle(rig)
  let maxVerticalAccelG = 0
  let maxPitchDeg = 0
  let minWheelContacts = 4
  let minSuspensionLength = Infinity
  let maxSuspensionLength = 0
  let previousVy = rig.chassis.linvel().y
  let seconds = 0
  while (seconds < 14 && rig.chassis.translation().z < 125) {
    const speed = speedKmh(rig)
    const throttle = speed < 27 ? 0.62 : speed > 30 ? 0.05 : 0.22
    step(rig, { throttle, brake: 0, steer: 0 })
    seconds += DT
    const vy = rig.chassis.linvel().y
    maxVerticalAccelG = Math.max(maxVerticalAccelG, Math.abs((vy - previousVy) / DT) / 9.81)
    previousVy = vy
    maxPitchDeg = Math.max(maxPitchDeg, Math.abs(pitchDeg(rig.chassis.rotation())))
    minWheelContacts = Math.min(minWheelContacts, [0, 1, 2, 3].filter((wheel) => rig.vehicle.wheelIsInContact(wheel)).length)
    for (let wheel = 0; wheel < 4; wheel += 1) {
      const length = rig.vehicle.wheelSuspensionLength(wheel) ?? TUNING.suspensionRestLength
      minSuspensionLength = Math.min(minSuspensionLength, length)
      maxSuspensionLength = Math.max(maxSuspensionLength, length)
    }
  }
  const result = {
    seconds,
    endKmh: speedKmh(rig),
    maxVerticalAccelG,
    maxPitchDeg,
    minWheelContacts,
    suspensionRangeM: maxSuspensionLength - minSuspensionLength,
    minSuspensionLengthM: minSuspensionLength,
    maxSuspensionLengthM: maxSuspensionLength,
  }
  rig.world.free()
  return result
}

function runTurn() {
  const rig = createRig()
  settle(rig)
  let guard = 0
  while (guard < 1800 && speedKmh(rig) < 30) {
    step(rig, { throttle: 1, brake: 0, steer: 0 })
    guard += 1
  }
  let maxRollDeg = 0
  let minWheelContacts = 4
  let maxSpeedKmh = speedKmh(rig)
  for (let i = 0; i < 5 / DT; i += 1) {
    step(rig, { throttle: 0.18, brake: 0, steer: 0.30 })
    maxRollDeg = Math.max(maxRollDeg, Math.abs(rollDeg(rig.chassis.rotation())))
    minWheelContacts = Math.min(minWheelContacts, [0, 1, 2, 3].filter((wheel) => rig.vehicle.wheelIsInContact(wheel)).length)
    maxSpeedKmh = Math.max(maxSpeedKmh, speedKmh(rig))
  }
  const p = rig.chassis.translation()
  const result = { maxRollDeg, minWheelContacts, maxSpeedKmh, finalX: p.x, finalZ: p.z, finalY: p.y }
  rig.world.free()
  return result
}

function runReverse() {
  const rig = createRig()
  settle(rig)
  let timeTo10 = null
  let peakReverseKmh = 0
  let time = 0
  while (time < 10) {
    step(rig, { throttle: 0, brake: 0.55, steer: 0, reverse: true })
    time += DT
    const signed = rig.vehicle.currentVehicleSpeed() * 3.6
    peakReverseKmh = Math.max(peakReverseKmh, Math.abs(Math.min(0, signed)))
    if (timeTo10 === null && signed <= -10) timeTo10 = time
  }
  const result = { timeTo10KmhSec: timeTo10, peakReverseKmh, endSignedKmh: rig.vehicle.currentVehicleSpeed() * 3.6 }
  rig.world.free()
  return result
}

const reverse = runReverse()
function yawDeg(q) {
  const siny = 2 * (q.w * q.y + q.x * q.z)
  const cosy = 1 - 2 * (q.y * q.y + q.z * q.z)
  return Math.atan2(siny, cosy) * 180 / Math.PI
}

function runRenderCadence(renderFps) {
  const rig = createRig()
  settle(rig)
  const frameDt = 1 / renderFps
  let accumulator = 0
  let renderTime = 0
  const total = 20
  while (renderTime < total - 1e-9) {
    let input
    if (renderTime < 6) input = { throttle: 1, brake: 0, steer: 0 }
    else if (renderTime < 10) input = { throttle: 0.6, brake: 0, steer: 0.35 }
    else if (renderTime < 12) input = { throttle: 0, brake: 0.55, steer: -0.25 }
    else if (renderTime < 16) input = { throttle: 0.8, brake: 0, steer: 0.10 }
    else input = { throttle: 0, brake: 1, steer: 0 }
    accumulator += frameDt
    let substeps = 0
    while (accumulator >= DT && substeps < 5) {
      step(rig, input)
      accumulator -= DT
      substeps += 1
    }
    if (substeps === 5) accumulator = 0
    renderTime += frameDt
  }
  const p = rig.chassis.translation()
  const result = { renderFps, x: p.x, y: p.y, z: p.z, speedKmh: speedKmh(rig), yawDeg: yawDeg(rig.chassis.rotation()) }
  rig.world.free()
  return result
}

const acceleration = runAcceleration()
const topSpeed = runTopSpeed()
const dryBrake = runBrake(1)
const wetBrake = runBrake(0.72)
const lateriteBrake = runBrake(0.56)
const turn = runTurn()
const rideComfort = runRideComfort()
const cadence = [30, 60, 120].map(runRenderCadence)
const report = {
  generatedAt: new Date().toISOString(),
  tuning: TUNING,
  reverse,
  acceleration,
  topSpeed,
  dryBrake,
  wetBrake,
  lateriteBrake,
  wetBrakeDistanceDeltaPct: ((wetBrake.stopDistanceM / dryBrake.stopDistanceM) - 1) * 100,
  lateriteBrakeDistanceDeltaPct: ((lateriteBrake.stopDistanceM / dryBrake.stopDistanceM) - 1) * 100,
  turn,
  rideComfort,
  cadence,
}
console.log(JSON.stringify(report, null, 2))
