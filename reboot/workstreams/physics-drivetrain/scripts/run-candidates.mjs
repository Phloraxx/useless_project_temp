import { spawnSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"

const presets = {
  balanced: {},
  heavy: {
    engineForce: 10500, brakeImpulse: 315, maxSpeedKmh: 64, throttleRise: 1.45,
    highSpeedSteerDeg: 7.5, steerResponse: 2.25, suspensionStiffness: 29,
    suspensionCompression: 5.2, suspensionRelaxation: 6.5, maxSuspensionTravel: 0.30,
    maxSuspensionForce: 86000, frictionSlip: 3.0, sideFrictionStiffness: 1.18,
    shiftDurationMs: 365, highSpeedYawDamping: 0.40,
  },
  maniac: {
    engineForce: 14000, brakeImpulse: 385, maxSpeedKmh: 70, throttleRise: 2.35,
    maxSteerDeg: 32, highSpeedSteerDeg: 9.5, steerFadeEndKmh: 65, steerResponse: 3.35,
    suspensionStiffness: 36, suspensionCompression: 4.5, suspensionRelaxation: 5.3,
    maxSuspensionTravel: 0.24, maxSuspensionForce: 88000, frictionSlip: 3.4,
    sideFrictionStiffness: 1.30, shiftDurationMs: 270, highSpeedYawDamping: 0.32,
  },
}

mkdirSync("benchmarks", { recursive: true })
for (const [name, tuning] of Object.entries(presets)) {
  const env = { ...process.env }
  if (Object.keys(tuning).length) env.R1_TUNING = JSON.stringify(tuning)
  else delete env.R1_TUNING
  const run = spawnSync(process.execPath, ["scripts/benchmark.mjs"], { env, encoding: "utf8" })
  if (run.status !== 0) {
    process.stderr.write(run.stderr)
    process.exit(run.status ?? 1)
  }
  const report = JSON.parse(run.stdout)
  writeFileSync(`benchmarks/${name}-drivetrain-final.json`, JSON.stringify(report, null, 2) + "\n")
  console.log(`${name}: ${report.topSpeed.peakKmh.toFixed(2)} km/h peak; steering=${report.steeringVerification.physicallyCorrect}; fixed-step=${Math.max(...report.fixedStepDeltas.map((x) => x.positionDeltaM)).toFixed(6)} m`)
}
