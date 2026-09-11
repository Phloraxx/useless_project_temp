import { useEffect, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d-compat"
import { BUS, SURFACE_GRIP, type BusTuning, type Telemetry } from "./sim/config"
import { createKeyboardInput } from "./sim/input"
import { createDrivetrainState, resetDrivetrain, stepDrivetrain, type DrivetrainOutput, type DrivetrainState } from "./sim/drivetrain"
import { AnimatedCharacter } from "./characters/components/AnimatedCharacter"
import { MotionSignalContext, ZERO_MOTION } from "./characters/animation/motionSignalStore"
import type { CharacterState } from "./characters/types"
import { KeralaVerticalSlice } from "./world/KeralaVerticalSlice"

type Props = {
  tuning: BusTuning
  onTelemetry: (value: Telemetry) => void
  resetToken?: number
  runActive?: boolean
}

type Simulation = {
  world: RAPIER.World
  chassis: RAPIER.RigidBody
  vehicle: RAPIER.DynamicRayCastVehicleController
  input: ReturnType<typeof createKeyboardInput>
  accumulator: number
  steering: number
  throttleApplied: number
  brakeApplied: number
  telemetryClock: number
  previousTelemetryVelocity: THREE.Vector3
  previousTelemetryYaw: number
  previousFrameVelocity: THREE.Vector3
  drivetrain: DrivetrainState
  drivetrainOutput: DrivetrainOutput
  eventQueue: RAPIER.EventQueue
  impactSerial: number
  impactSpeedKmh: number
}

const RAD_TO_DEG = 180 / Math.PI
const BUS_INERTIA = {
  x: BUS.massKg * ((BUS.colliderHalfExtents[1] * 2) ** 2 + (BUS.colliderHalfExtents[2] * 2) ** 2) / 12,
  y: BUS.massKg * ((BUS.colliderHalfExtents[0] * 2) ** 2 + (BUS.colliderHalfExtents[2] * 2) ** 2) / 12,
  z: BUS.massKg * ((BUS.colliderHalfExtents[0] * 2) ** 2 + (BUS.colliderHalfExtents[1] * 2) ** 2) / 12,
}
const moveToward = (current: number, target: number, maxDelta: number) => {
  if (Math.abs(target - current) <= maxDelta) return target
  return current + Math.sign(target - current) * maxDelta
}

function surfaceAt(x: number, z: number): Telemetry["surface"] {
  if (Math.abs(x) > 6.25) return "laterite"
  if (z >= 360 && z <= 420) return "wet"
  if (z >= 425 && z <= 476) return "rough"
  return "asphalt"
}

function surfaceGrip(surface: Telemetry["surface"]) {
  return SURFACE_GRIP[surface]
}

function addFixedBox(
  world: RAPIER.World,
  halfExtents: [number, number, number],
  position: [number, number, number],
  friction = 0.9,
  reportCollision = false,
) {
  const collider = RAPIER.ColliderDesc.cuboid(...halfExtents)
    .setTranslation(...position)
    .setFriction(friction)
  if (reportCollision) collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  world.createCollider(collider)
}

function configureWheel(
  vehicle: RAPIER.DynamicRayCastVehicleController,
  index: number,
  tuning: BusTuning,
  grip = 1,
) {
  vehicle.setWheelSuspensionRestLength(index, tuning.suspensionRestLength)
  vehicle.setWheelSuspensionStiffness(index, tuning.suspensionStiffness)
  vehicle.setWheelSuspensionCompression(index, tuning.suspensionCompression)
  vehicle.setWheelSuspensionRelaxation(index, tuning.suspensionRelaxation)
  vehicle.setWheelMaxSuspensionTravel(index, tuning.maxSuspensionTravel)
  vehicle.setWheelMaxSuspensionForce(index, tuning.maxSuspensionForce)
  vehicle.setWheelFrictionSlip(index, tuning.frictionSlip * grip)
  vehicle.setWheelSideFrictionStiffness(index, tuning.sideFrictionStiffness * grip)
}

function resetBus(sim: Simulation) {
  sim.chassis.setTranslation(BUS.start, true)
  sim.chassis.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
  sim.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true)
  sim.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true)
  sim.steering = 0
  sim.throttleApplied = 0
  sim.brakeApplied = 0
  sim.accumulator = 0
  sim.telemetryClock = 0
  sim.previousTelemetryVelocity.set(0, 0, 0)
  sim.previousTelemetryYaw = 0
  sim.previousFrameVelocity.set(0, 0, 0)
  sim.impactSpeedKmh = 0
  resetDrivetrain(sim.drivetrain)
  sim.drivetrainOutput = stepDrivetrain(sim.drivetrain, 0, 0, 0, 320)
}

function GroundAndCourse() {
  const conePositions = [
    [-2.1, 125], [2.1, 145], [-2.1, 165], [2.1, 185], [-2.1, 205],
    [0, 315], [3.2, 330], [4.2, 350], [3.2, 370], [0, 385], [-3.2, 370], [-4.2, 350], [-3.2, 330],
  ] as const

  return (
    <group>
      <mesh receiveShadow position={[0, -0.44, 445]}>
        <boxGeometry args={[90, 0.22, 950]} />
        <meshStandardMaterial color="#4e5547" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, -0.12, 445]}>
        <boxGeometry args={[13, 0.24, 930]} />
        <meshStandardMaterial color="#30343a" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[-8.5, -0.17, 445]}>
        <boxGeometry args={[4, 0.18, 930]} />
        <meshStandardMaterial color="#765640" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[8.5, -0.17, 445]}>
        <boxGeometry args={[4, 0.18, 930]} />
        <meshStandardMaterial color="#765640" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.012, 390]}>
        <boxGeometry args={[12.7, 0.018, 60]} />
        <meshStandardMaterial color="#27333b" roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh receiveShadow position={[0, 0.095, 300]}>
        <boxGeometry args={[12.4, 0.19, 0.75]} />
        <meshStandardMaterial color="#c7aa4a" roughness={0.8} />
      </mesh>

      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`rough-${i}`} receiveShadow position={[((i % 3) - 1) * 1.6, 0.045 + (i % 2) * 0.015, 432 + i * 5.2]}>
          <boxGeometry args={[8.6 - (i % 2) * 1.1, 0.07 + (i % 3) * 0.018, 0.55 + (i % 2) * 0.35]} />
          <meshStandardMaterial color="#555b5f" roughness={1} />
        </mesh>
      ))}

      {Array.from({ length: 45 }, (_, i) => (
        <mesh key={`center-${i}`} position={[0, 0.015, i * 20 + 10]}>
          <boxGeometry args={[0.11, 0.025, 7]} />
          <meshStandardMaterial color="#ddd9c8" />
        </mesh>
      ))}

      <mesh position={[0, 0.035, 92]}>
        <boxGeometry args={[12.6, 0.035, 0.45]} />
        <meshStandardMaterial color="#d9c35d" />
      </mesh>
      <mesh position={[0, 0.04, 102]}>
        <boxGeometry args={[12.6, 0.04, 0.7]} />
        <meshStandardMaterial color="#d9c35d" />
      </mesh>

      {conePositions.map(([x, z], i) => (
        <group key={`cone-${i}`} position={[x, 0.34, z]}>
          <mesh castShadow>
            <coneGeometry args={[0.24, 0.68, 10]} />
            <meshStandardMaterial color="#d87f36" />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.46, 0.06, 0.46]} />
            <meshStandardMaterial color="#17191c" />
          </mesh>
        </group>
      ))}

      <Barrier position={[-4.55, 0.58, 232]} />
      <Barrier position={[4.55, 0.58, 257]} />
      <Barrier position={[-4.55, 0.58, 282]} />

      <mesh position={[0, 0.03, 300]}>
        <boxGeometry args={[12.5, 0.03, 0.18]} />
        <meshStandardMaterial color="#b9c8d4" />
      </mesh>
      <mesh position={[0, 0.03, 400]}>
        <boxGeometry args={[12.5, 0.03, 0.18]} />
        <meshStandardMaterial color="#b9c8d4" />
      </mesh>
    </group>
  )
}

function BusStopSet() {
  return (
    <group position={[5.4, 0, 102]}>
      <mesh castShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[0.12, 2.7, 0.12]} />
        <meshStandardMaterial color="#313840" />
      </mesh>
      <mesh castShadow position={[0, 2.55, 0]}>
        <boxGeometry args={[1.65, 0.62, 0.10]} />
        <meshStandardMaterial color="#d7c04d" />
      </mesh>
      <mesh position={[-0.02, 2.55, -0.06]}>
        <planeGeometry args={[1.45, 0.42]} />
        <meshBasicMaterial color="#252b30" />
      </mesh>
      <mesh castShadow position={[1.7, 1.15, 0.35]}>
        <boxGeometry args={[2.4, 0.12, 2.3]} />
        <meshStandardMaterial color="#5a5148" />
      </mesh>
      <mesh castShadow position={[1.7, 2.3, 0.35]}>
        <boxGeometry args={[2.7, 0.13, 2.55]} />
        <meshStandardMaterial color="#7b5639" />
      </mesh>
      {[-0.5, 0.2, 0.9].map((x, i) => (
        <group key={i} position={[x + 1.15, 0.95, -0.2 + i * 0.45]}>
          <mesh castShadow position={[0, 0.72, 0]}>
            <capsuleGeometry args={[0.18, 0.72, 5, 8]} />
            <meshStandardMaterial color={["#526c78", "#826653", "#6d7154"][i]} />
          </mesh>
          <mesh castShadow position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.20, 12, 10]} />
            <meshStandardMaterial color="#8b684f" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function AutoObstacle() {
  return (
    <group position={[-1.55, 0.48, 218]} rotation-y={0.08}>
      <mesh castShadow position={[0, 0.52, 0]}>
        <boxGeometry args={[1.55, 1.05, 3.0]} />
        <meshStandardMaterial color="#d6a525" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 1.12, -0.15]}>
        <boxGeometry args={[1.28, 0.52, 1.45]} />
        <meshStandardMaterial color="#252b2e" roughness={0.35} />
      </mesh>
      {[-0.58, 0.58].flatMap((x) => [-0.95, 0.95].map((z) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, 0.20, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.16, 12]} />
          <meshStandardMaterial color="#16181a" />
        </mesh>
      )))}
    </group>
  )
}

function QueueObstacles() {
  return <>
    <group position={[1.85, 0.52, 558]} rotation-y={0.03}>
      <mesh castShadow position={[0,0.55,0]}><boxGeometry args={[1.7,0.9,3.5]} /><meshStandardMaterial color="#5e6e72" roughness={0.74} /></mesh>
      <mesh position={[0,1.08,-0.15]}><boxGeometry args={[1.48,0.55,1.7]} /><meshStandardMaterial color="#334147" /></mesh>
    </group>
    <group position={[-1.75, 0.48, 580]} rotation-y={-0.05}>
      <mesh castShadow position={[0,0.52,0]}><boxGeometry args={[1.55,1.05,3.0]} /><meshStandardMaterial color="#c7a322" roughness={0.72} /></mesh>
      <mesh position={[0,1.12,-0.15]}><boxGeometry args={[1.28,0.52,1.45]} /><meshStandardMaterial color="#252b2e" /></mesh>
    </group>
  </>
}

function SecondBusStopSet() {
  return <group position={[-5.45,0,625]} rotation-y={Math.PI}>
    <mesh castShadow position={[0,1.35,0]}><boxGeometry args={[0.12,2.7,0.12]} /><meshStandardMaterial color="#313840" /></mesh>
    <mesh castShadow position={[0,2.55,0]}><boxGeometry args={[1.65,0.62,0.10]} /><meshStandardMaterial color="#d7c04d" /></mesh>
    <mesh castShadow position={[-1.8,1.15,0.2]}><boxGeometry args={[2.5,0.12,2.2]} /><meshStandardMaterial color="#5b5249" /></mesh>
    {[[-1.1,"#795e70"],[-1.8,"#55746a"]].map(([x,color],i)=><group key={i} position={[Number(x),0.95,-0.15+i*0.55]}>
      <mesh castShadow position={[0,0.72,0]}><capsuleGeometry args={[0.18,0.72,5,8]} /><meshStandardMaterial color={String(color)} /></mesh>
      <mesh castShadow position={[0,1.45,0]}><sphereGeometry args={[0.20,12,10]} /><meshStandardMaterial color="#8b684f" /></mesh>
    </group>)}
  </group>
}

function QualificationBillboard() {
  return (
    <group position={[5.55, 0, 343]}>
      <mesh castShadow position={[0, 1.85, 0]}>
        <boxGeometry args={[0.14, 3.7, 0.14]} />
        <meshStandardMaterial color="#30353a" />
      </mesh>
      <mesh castShadow position={[-0.9, 3.05, 0]}>
        <boxGeometry args={[3.6, 1.65, 0.12]} />
        <meshStandardMaterial color="#eee9d7" />
      </mesh>
      <mesh position={[-0.9, 3.05, -0.07]}>
        <planeGeometry args={[3.28, 1.34]} />
        <meshBasicMaterial color="#922f2c" />
      </mesh>
    </group>
  )
}

function Barrier({ position }: { position: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={[4.0, 1.16, 1.1]} />
      <meshStandardMaterial color="#b8bec5" roughness={0.85} />
    </mesh>
  )
}

export function HandlingLab({ tuning, onTelemetry, resetToken = 0, runActive = true }: Props) {
  const simRef = useRef<Simulation | null>(null)
  const tuningRef = useRef(tuning)
  const busRef = useRef<THREE.Group>(null)
  const visualBodyRef = useRef<THREE.Group>(null)
  const visualRoll = useRef(0)
  const visualPitch = useRef(0)
  const visualHeave = useRef(0)
  const wheelRefs = useRef<Array<THREE.Group | null>>([])
  const cameraLook = useRef(new THREE.Vector3(0, 1.5, 6))
  const cameraVelocity = useRef(new THREE.Vector3())
  const lookVelocity = useRef(new THREE.Vector3())
  const chassisQuaternion = useRef(new THREE.Quaternion())
  const tempForward = useRef(new THREE.Vector3())
  const tempRight = useRef(new THREE.Vector3())
  const tempUp = useRef(new THREE.Vector3())
  const desiredCamera = useRef(new THREE.Vector3())
  const desiredLook = useRef(new THREE.Vector3())
  const tempDelta = useRef(new THREE.Vector3())
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"))
  const runActiveRef = useRef(runActive)
  const motionSignals = useRef({ ...ZERO_MOTION })
  const cinematicRef = useRef<{ until: number } | null>(null)
  const cinematicPosition = useRef(new THREE.Vector3())
  const cinematicLook = useRef(new THREE.Vector3())
  const translationVector = useRef(new THREE.Vector3())
  const [examinerState, setExaminerState] = useState<CharacterState>("sitIdle")

  useEffect(() => {
    tuningRef.current = tuning
  }, [tuning])

  useEffect(() => {
    runActiveRef.current = runActive
  }, [runActive])

  useEffect(() => {
    let timer = 0
    const onGrading = () => {
      if (!runActiveRef.current) return
      cinematicRef.current = { until: performance.now() + 1550 }
      setExaminerState("sitTalk")
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setExaminerState("sitIdle"), 1500)
    }
    window.addEventListener("adutha:grading-shot", onGrading)
    return () => { window.removeEventListener("adutha:grading-shot", onGrading); window.clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const sim = simRef.current
    if (sim) resetBus(sim)
  }, [resetToken])

  useEffect(() => {
    let cancelled = false
    let createdWorld: RAPIER.World | null = null

    const boot = async () => {
      await RAPIER.init()
      if (cancelled) return

      const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
      createdWorld = world
      world.timestep = BUS.fixedDt

      addFixedBox(world, [45, 0.11, 475], [0, -0.44, 445], 0.52)
      addFixedBox(world, [6.5, 0.2, 465], [0, -0.2, 445], 1.0)
      addFixedBox(world, [2.0, 0.2, 465], [-8.5, -0.2, 445], 0.65)
      addFixedBox(world, [2.0, 0.2, 465], [8.5, -0.2, 445], 0.65)
      addFixedBox(world, [6.2, 0.095, 0.375], [0, 0.095, 300], 0.9)
      for (let i = 0; i < 8; i += 1) {
        const y = 0.035 + (i % 2) * 0.015
        const halfY = (0.07 + (i % 3) * 0.018) / 2
        const halfZ = (0.55 + (i % 2) * 0.35) / 2
        addFixedBox(world, [(8.6 - (i % 2) * 1.1) / 2, halfY, halfZ], [((i % 3) - 1) * 1.6, y, 432 + i * 5.2], 0.82)
      }
      addFixedBox(world, [2.0, 0.58, 0.55], [-4.55, 0.58, 232], 0.7, true)
      addFixedBox(world, [2.0, 0.58, 0.55], [4.55, 0.58, 257], 0.7, true)
      addFixedBox(world, [2.0, 0.58, 0.55], [-4.55, 0.58, 282], 0.7, true)
      addFixedBox(world, [0.78, 0.72, 1.5], [-1.55, 0.72, 218], 0.7, true)
      addFixedBox(world, [0.85, 0.75, 1.75], [1.85, 0.75, 558], 0.72, true)
      addFixedBox(world, [0.78, 0.72, 1.5], [-1.75, 0.72, 580], 0.72, true)

      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(BUS.start.x, BUS.start.y, BUS.start.z)
        .setLinearDamping(BUS.linearDamping)
        .setAngularDamping(BUS.angularDamping)
        .setAdditionalMassProperties(
          BUS.massKg,
          { x: 0, y: BUS.comOffsetY, z: 0 },
          BUS_INERTIA,
          { x: 0, y: 0, z: 0, w: 1 },
        )
        .setCanSleep(false)
      const chassis = world.createRigidBody(bodyDesc)
      chassis.enableCcd(true)

      const chassisCollider = RAPIER.ColliderDesc.cuboid(...BUS.colliderHalfExtents)
        .setTranslation(0, 0.08, 0)
        .setDensity(0)
        .setFriction(0.18)
        .setRestitution(0)
      world.createCollider(chassisCollider, chassis)

      const vehicle = world.createVehicleController(chassis)
      vehicle.indexUpAxis = 1
      vehicle.setIndexForwardAxis = 2

      const halfTrack = BUS.trackWidthM / 2
      const halfWheelbase = BUS.wheelbaseM / 2
      const hardPointY = -0.18
      const wheelPoints = [
        { x: -halfTrack, y: hardPointY, z: halfWheelbase },
        { x: halfTrack, y: hardPointY, z: halfWheelbase },
        { x: -halfTrack, y: hardPointY, z: -halfWheelbase },
        { x: halfTrack, y: hardPointY, z: -halfWheelbase },
      ]

      wheelPoints.forEach((point) => {
        vehicle.addWheel(
          point,
          { x: 0, y: -1, z: 0 },
          { x: -1, y: 0, z: 0 },
          tuningRef.current.suspensionRestLength,
          BUS.wheelRadiusM,
        )
      })
      for (let i = 0; i < 4; i += 1) configureWheel(vehicle, i, tuningRef.current)

      const input = createKeyboardInput()
      const drivetrain = createDrivetrainState()
      const eventQueue = new RAPIER.EventQueue(true)
      simRef.current = {
        world,
        chassis,
        vehicle,
        input,
        accumulator: 0,
        steering: 0,
        throttleApplied: 0,
        brakeApplied: 0,
        telemetryClock: 0,
        previousTelemetryVelocity: new THREE.Vector3(),
        previousTelemetryYaw: 0,
        previousFrameVelocity: new THREE.Vector3(),
        drivetrain,
        drivetrainOutput: stepDrivetrain(drivetrain, 0, 0, 0, tuningRef.current.shiftDurationMs),
        eventQueue,
        impactSerial: 0,
        impactSpeedKmh: 0,
      }
      resetBus(simRef.current)
    }

    void boot()
    return () => {
      cancelled = true
      const sim = simRef.current
      if (sim) sim.input.dispose()
      simRef.current = null
      createdWorld?.free()
    }
  }, [])

  useFrame(({ camera }, frameDelta) => {
    const sim = simRef.current
    if (!sim) return

    const delta = Math.min(frameDelta, 0.1)
    const sampledInput = sim.input.sample()
    const input = runActiveRef.current
      ? sampledInput
      : { ...sampledInput, throttle: 0, brake: 1, reverseRequested: false, steer: 0, resetRequested: false }
    if (input.resetRequested) resetBus(sim)

    sim.accumulator += delta
    let substeps = 0
    const tuningNow = tuningRef.current

    while (sim.accumulator >= BUS.fixedDt && substeps < BUS.maxSubsteps) {
      const signedSpeedKmhNow = sim.vehicle.currentVehicleSpeed() * 3.6
      const speedKmh = Math.abs(signedSpeedKmhNow)
      const fadeRange = Math.max(1, tuningNow.steerFadeEndKmh - tuningNow.steerFadeStartKmh)
      const steerT = Math.max(0, Math.min(1, (speedKmh - tuningNow.steerFadeStartKmh) / fadeRange))
      const smoothSteerT = steerT * steerT * (3 - 2 * steerT)
      const allowedSteerDeg = tuningNow.maxSteerDeg + (tuningNow.highSpeedSteerDeg - tuningNow.maxSteerDeg) * smoothSteerT
      const requestedSteer = input.steer * allowedSteerDeg / RAD_TO_DEG
      sim.steering = moveToward(
        sim.steering,
        requestedSteer,
        tuningNow.steerResponse * BUS.fixedDt,
      )

      const reverseDrive = input.reverseRequested && signedSpeedKmhNow < 0.8 && input.throttle === 0
      const brakingForDirectionChange = input.reverseRequested && signedSpeedKmhNow >= 0.8
      const throttleTarget = input.brake >= 1 || brakingForDirectionChange ? 0 : input.throttle
      const brakeTarget = reverseDrive ? 0 : input.brake
      sim.throttleApplied = moveToward(
        sim.throttleApplied,
        throttleTarget,
        (throttleTarget > sim.throttleApplied ? tuningNow.throttleRise : tuningNow.throttleFall) * BUS.fixedDt,
      )
      sim.brakeApplied = moveToward(
        sim.brakeApplied,
        brakeTarget,
        (brakeTarget > sim.brakeApplied ? tuningNow.brakeRise : tuningNow.brakeFall) * BUS.fixedDt,
      )

      const pose = sim.chassis.translation()
      const grip = surfaceGrip(surfaceAt(pose.x, pose.z))
      for (let i = 0; i < 4; i += 1) configureWheel(sim.vehicle, i, tuningNow, grip)
      sim.vehicle.setWheelSteering(0, sim.steering)
      sim.vehicle.setWheelSteering(1, sim.steering)
      sim.vehicle.setWheelSteering(2, 0)
      sim.vehicle.setWheelSteering(3, 0)

      sim.drivetrainOutput = stepDrivetrain(
        sim.drivetrain,
        BUS.fixedDt,
        Math.max(0, signedSpeedKmhNow),
        reverseDrive ? 0 : sim.throttleApplied,
        tuningNow.shiftDurationMs,
      )
      if (sim.drivetrainOutput.shiftEvent) {
        window.dispatchEvent(new CustomEvent("adutha:drivetrain-shift", { detail: sim.drivetrainOutput.shiftEvent }))
      }

      const capBand = Math.max(5, tuningNow.maxSpeedKmh * 0.11)
      const forwardPowerScale = Math.max(0, Math.min(1, (tuningNow.maxSpeedKmh - Math.max(0, signedSpeedKmhNow)) / capBand))
      const reverseBand = Math.max(2, tuningNow.maxReverseKmh * 0.20)
      const reversePowerScale = Math.max(0, Math.min(1, (tuningNow.maxReverseKmh - Math.abs(Math.min(0, signedSpeedKmhNow))) / reverseBand))
      const engineForce = reverseDrive
        ? -tuningNow.engineForce * 0.43 * reversePowerScale
        : sim.throttleApplied * tuningNow.engineForce * sim.drivetrainOutput.torqueMultiplier * forwardPowerScale
      sim.vehicle.setWheelEngineForce(0, 0)
      sim.vehicle.setWheelEngineForce(1, 0)
      sim.vehicle.setWheelEngineForce(2, engineForce)
      sim.vehicle.setWheelEngineForce(3, engineForce)

      const brakeGrip = 0.35 + 0.65 * grip
      for (let i = 0; i < 4; i += 1) {
        sim.vehicle.setWheelBrake(i, sim.brakeApplied * tuningNow.brakeImpulse * brakeGrip)
      }

      sim.vehicle.updateVehicle(
        BUS.fixedDt,
        RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      )
      const stabilityRatio = Math.max(0, Math.min(1, speedKmh / Math.max(1, tuningNow.maxSpeedKmh)))
      sim.chassis.setAngularDamping(BUS.angularDamping + tuningNow.highSpeedYawDamping * stabilityRatio * stabilityRatio)
      sim.world.step(sim.eventQueue)
      sim.eventQueue.drainCollisionEvents((_handle1, _handle2, started) => {
        if (!started) return
        sim.impactSerial += 1
        sim.impactSpeedKmh = speedKmh
      })
      sim.accumulator -= BUS.fixedDt
      substeps += 1
    }

    if (substeps === BUS.maxSubsteps) sim.accumulator = 0

    const translation = sim.chassis.translation()
    const rotation = sim.chassis.rotation()
    const threeQ = chassisQuaternion.current.set(rotation.x, rotation.y, rotation.z, rotation.w)

    if (busRef.current) {
      busRef.current.position.set(translation.x, translation.y, translation.z)
      busRef.current.quaternion.copy(threeQ)
    }

    for (let i = 0; i < 4; i += 1) {
      const wheel = wheelRefs.current[i]
      if (!wheel) continue
      const hardPoint = sim.vehicle.wheelHardPoint(i)
      if (!hardPoint) continue

      const contact = sim.vehicle.wheelIsInContact(i)
      const contactPoint = sim.vehicle.wheelContactPoint(i)
      const contactNormal = sim.vehicle.wheelContactNormal(i)
      const suspensionLength = sim.vehicle.wheelSuspensionLength(i) ?? tuningNow.suspensionRestLength

      if (contact && contactPoint && contactNormal) {
        wheel.position.set(
          contactPoint.x + contactNormal.x * BUS.wheelRadiusM,
          contactPoint.y + contactNormal.y * BUS.wheelRadiusM,
          contactPoint.z + contactNormal.z * BUS.wheelRadiusM,
        )
      } else {
        tempUp.current.set(0, -1, 0).applyQuaternion(threeQ)
        wheel.position.set(hardPoint.x, hardPoint.y, hardPoint.z)
          .addScaledVector(tempUp.current, suspensionLength)
      }

      const steerQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        sim.vehicle.wheelSteering(i) ?? 0,
      )
      const spinQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        sim.vehicle.wheelRotation(i) ?? 0,
      )
      wheel.quaternion.copy(threeQ).multiply(steerQ).multiply(spinQ)
    }

    const forward = tempForward.current.set(0, 0, 1).applyQuaternion(threeQ).normalize()
    const right = tempRight.current.set(1, 0, 0).applyQuaternion(threeQ).normalize()
    const up = tempUp.current.set(0, 1, 0).applyQuaternion(threeQ).normalize()

    const frameVelocity = sim.chassis.linvel()
    const safeDelta = Math.max(delta, 1 / 120)
    const frameAx = (frameVelocity.x - sim.previousFrameVelocity.x) / safeDelta
    const frameAy = (frameVelocity.y - sim.previousFrameVelocity.y) / safeDelta
    const frameAz = (frameVelocity.z - sim.previousFrameVelocity.z) / safeDelta
    sim.previousFrameVelocity.set(frameVelocity.x, frameVelocity.y, frameVelocity.z)
    const frameLongAccel = frameAx * forward.x + frameAy * forward.y + frameAz * forward.z
    const frameLatAccel = frameAx * right.x + frameAy * right.y + frameAz * right.z
    const frameVerticalAccel = frameAx * up.x + frameAy * up.y + frameAz * up.z
    motionSignals.current.longitudinalAccel = frameLongAccel
    motionSignals.current.lateralAccel = frameLatAccel
    motionSignals.current.verticalImpulse = Math.max(0, Math.abs(frameVerticalAccel) - 0.8)
    motionSignals.current.yawRate = sim.chassis.angvel().y

    const targetBodyRoll = THREE.MathUtils.clamp(-frameLatAccel * tuningNow.bodyRollGain, -0.075, 0.075)
    const shiftPitchRelease = sim.drivetrainOutput.shifting ? 0.0075 * sim.drivetrainOutput.load : 0
    const targetBodyPitch = THREE.MathUtils.clamp(-frameLongAccel * tuningNow.bodyPitchGain + shiftPitchRelease, -0.058, 0.058)
    const targetBodyHeave = THREE.MathUtils.clamp(-frameVerticalAccel * 0.0045, -0.055, 0.045)
    const bodyBlend = 1 - Math.exp(-tuningNow.bodyMotionResponse * delta)
    visualRoll.current = THREE.MathUtils.lerp(visualRoll.current, targetBodyRoll, bodyBlend)
    visualPitch.current = THREE.MathUtils.lerp(visualPitch.current, targetBodyPitch, bodyBlend)
    visualHeave.current = THREE.MathUtils.lerp(visualHeave.current, targetBodyHeave, 1 - Math.exp(-7.0 * delta))
    if (visualBodyRef.current) {
      visualBodyRef.current.rotation.set(visualPitch.current, 0, visualRoll.current)
      visualBodyRef.current.position.y = visualHeave.current
    }

    const signedSpeedKmh = sim.vehicle.currentVehicleSpeed() * 3.6
    const speedRatio = Math.min(1, Math.abs(signedSpeedKmh) / Math.max(1, tuningNow.maxSpeedKmh))
    const maxSteerRad = tuningNow.maxSteerDeg / RAD_TO_DEG
    const steerRatio = maxSteerRad > 0 ? sim.steering / maxSteerRad : 0

    desiredCamera.current
      .set(translation.x, translation.y, translation.z)
      .addScaledVector(up, tuningNow.cameraHeight + speedRatio * 0.5)
      .addScaledVector(forward, -(tuningNow.cameraDistance + speedRatio * tuningNow.cameraSpeedPullback))
    desiredLook.current
      .set(translation.x, translation.y, translation.z)
      .addScaledVector(up, 1.4)
      .addScaledVector(forward, tuningNow.cameraLookAhead + speedRatio * 4.0)
      .addScaledVector(right, steerRatio * 1.4)

    const cinematic = cinematicRef.current
    if (cinematic && performance.now() < cinematic.until) {
      translationVector.current.set(translation.x, translation.y, translation.z)
      cinematicPosition.current.set(3.45, 2.15, 2.6).applyQuaternion(threeQ).add(translationVector.current)
      cinematicLook.current.set(0.55, 1.65, 3.05).applyQuaternion(threeQ).add(translationVector.current)
      desiredCamera.current.copy(cinematicPosition.current)
      desiredLook.current.copy(cinematicLook.current)
    } else if (cinematic) {
      cinematicRef.current = null
    }

    const probeOrigin = {
      x: translation.x + up.x * 2.8,
      y: translation.y + up.y * 2.8,
      z: translation.z + up.z * 2.8,
    }
    const probeX = desiredCamera.current.x - probeOrigin.x
    const probeY = desiredCamera.current.y - probeOrigin.y
    const probeZ = desiredCamera.current.z - probeOrigin.z
    const probeLength = Math.hypot(probeX, probeY, probeZ)
    if (probeLength > 0.01) {
      const invLength = 1 / probeLength
      const ray = new RAPIER.Ray(probeOrigin, {
        x: probeX * invLength,
        y: probeY * invLength,
        z: probeZ * invLength,
      })
      const hit = sim.world.castRay(
        ray,
        probeLength,
        true,
        RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      )
      if (hit) {
        const safeDistance = Math.max(2.8, hit.timeOfImpact - 0.45)
        desiredCamera.current.set(
          probeOrigin.x + ray.dir.x * safeDistance,
          probeOrigin.y + ray.dir.y * safeDistance,
          probeOrigin.z + ray.dir.z * safeDistance,
        )
      }
    }

    tempDelta.current.subVectors(desiredCamera.current, camera.position)
    cameraVelocity.current.addScaledVector(tempDelta.current, tuningNow.cameraSpring * delta)
    cameraVelocity.current.multiplyScalar(Math.exp(-9.5 * delta))
    camera.position.addScaledVector(cameraVelocity.current, delta)

    tempDelta.current.subVectors(desiredLook.current, cameraLook.current)
    lookVelocity.current.addScaledVector(tempDelta.current, tuningNow.cameraLookSpring * delta)
    lookVelocity.current.multiplyScalar(Math.exp(-11 * delta))
    cameraLook.current.addScaledVector(lookVelocity.current, delta)
    camera.lookAt(cameraLook.current)
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = 52 + speedRatio * tuningNow.cameraFovBoost
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-4 * delta))
      camera.updateProjectionMatrix()
    }

    sim.telemetryClock += delta
    if (sim.telemetryClock >= 1 / 12) {
      const sampleDt = sim.telemetryClock
      sim.telemetryClock = 0
      euler.current.setFromQuaternion(threeQ, "YXZ")
      const linvel = sim.chassis.linvel()
      const ax = (linvel.x - sim.previousTelemetryVelocity.x) / sampleDt
      const ay = (linvel.y - sim.previousTelemetryVelocity.y) / sampleDt
      const az = (linvel.z - sim.previousTelemetryVelocity.z) / sampleDt
      const longitudinalAccel = ax * forward.x + ay * forward.y + az * forward.z
      const lateralAccel = ax * right.x + ay * right.y + az * right.z
      let yawDelta = euler.current.y - sim.previousTelemetryYaw
      if (yawDelta > Math.PI) yawDelta -= Math.PI * 2
      if (yawDelta < -Math.PI) yawDelta += Math.PI * 2
      const yawRateDeg = yawDelta / sampleDt * RAD_TO_DEG
      sim.previousTelemetryVelocity.set(linvel.x, linvel.y, linvel.z)
      sim.previousTelemetryYaw = euler.current.y

      onTelemetry({
        ready: true,
        speedKmh: signedSpeedKmh,
        position: [translation.x, translation.y, translation.z],
        steeringDeg: sim.steering * RAD_TO_DEG,
        throttle: sim.throttleApplied,
        brake: sim.brakeApplied,
        rollDeg: euler.current.z * RAD_TO_DEG,
        pitchDeg: euler.current.x * RAD_TO_DEG,
        yawDeg: euler.current.y * RAD_TO_DEG,
        bodyRollDeg: visualRoll.current * RAD_TO_DEG,
        bodyPitchDeg: visualPitch.current * RAD_TO_DEG,
        yawRateDeg,
        longitudinalAccel,
        lateralAccel,
        surface: surfaceAt(translation.x, translation.z),
        gear: sim.drivetrainOutput.gear,
        normalizedRpm: sim.drivetrainOutput.normalizedRpm,
        drivetrainLoad: sim.drivetrainOutput.load,
        shifting: sim.drivetrainOutput.shifting,
        shiftProgress: sim.drivetrainOutput.shiftProgress,
        shiftSerial: sim.drivetrain.shiftSerial,
        impactSerial: sim.impactSerial,
        impactSpeedKmh: sim.impactSpeedKmh,
        wheels: Array.from({ length: 4 }, (_, i) => ({
          contact: sim.vehicle.wheelIsInContact(i),
          suspensionLength: sim.vehicle.wheelSuspensionLength(i) ?? 0,
          suspensionForce: sim.vehicle.wheelSuspensionForce(i) ?? 0,
          forwardImpulse: sim.vehicle.wheelForwardImpulse(i) ?? 0,
          sideImpulse: sim.vehicle.wheelSideImpulse(i) ?? 0,
        })),
      })
    }
  })

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight
        castShadow
        position={[18, 28, -12]}
        intensity={2.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={28}
        shadow-camera-bottom={-8}
      />
      <color attach="background" args={["#aab2b7"]} />
      <fog attach="fog" args={["#aab2b7", 80, 360]} />

      <GroundAndCourse />
      <KeralaVerticalSlice />
      <BusStopSet />
      <AutoObstacle />
      <QueueObstacles />
      <SecondBusStopSet />
      <QualificationBillboard />

      <group ref={busRef}>
        <group ref={visualBodyRef}>
          <mesh castShadow position={[0, 0.98, -0.05]}>
            <boxGeometry args={[2.34, 1.08, 10.55]} />
            <meshStandardMaterial color="#8f2f2c" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0, 2.72, -0.05]}>
            <boxGeometry args={[2.34, 0.42, 10.55]} />
            <meshStandardMaterial color="#8f2f2c" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0, 0.70, 0]}>
            <boxGeometry args={[2.38, 0.32, 10.7]} />
            <meshStandardMaterial color="#d4c7a5" roughness={0.9} />
          </mesh>
          {[-1.19, 1.19].map((x) => (
            <mesh key={x} position={[x, 1.88, -0.15]}>
              <boxGeometry args={[0.055, 1.26, 8.7]} />
              <meshStandardMaterial color="#26343a" transparent opacity={0.38} roughness={0.25} />
            </mesh>
          ))}
          <mesh castShadow position={[0, 1.95, 5.22]}>
            <boxGeometry args={[2.22, 1.30, 0.11]} />
            <meshStandardMaterial color="#223137" transparent opacity={0.58} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.55, 5.30]}>
            <boxGeometry args={[1.52, 0.34, 0.04]} />
            <meshStandardMaterial color="#161b1d" />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[2.05, 0.10, 9.8]} />
            <meshStandardMaterial color="#5c5145" roughness={0.96} />
          </mesh>
          <MotionSignalContext.Provider value={motionSignals}>
            <group position={[0.52, 0.66, 3.18]} rotation-y={Math.PI}>
              <AnimatedCharacter role="examiner" state={examinerState} scale={0.95} lodMode="hero" />
            </group>
            <group position={[-0.62, 0.66, 1.0]} rotation-y={Math.PI}>
              <AnimatedCharacter role="conductor" state="railIdle" scale={0.95} lodMode="hero" />
            </group>
            <group position={[0.58, 0.66, -1.4]} rotation-y={Math.PI}>
              <AnimatedCharacter model="female" role="passenger" state="sitIdle" scale={0.94} lodMode="adaptive" />
            </group>
          </MotionSignalContext.Provider>
        </group>
      </group>

      {[0, 1, 2, 3].map((index) => (
        <group
          key={index}
          ref={(node) => { wheelRefs.current[index] = node }}
        >
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[BUS.wheelRadiusM, BUS.wheelRadiusM, 0.28, 18]} />
            <meshStandardMaterial color="#151719" roughness={0.94} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 0.30, 14]} />
            <meshStandardMaterial color="#8f969b" metalness={0.35} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </>
  )
}
