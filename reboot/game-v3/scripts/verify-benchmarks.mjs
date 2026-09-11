import { readFileSync } from "node:fs"

const load = (name) => JSON.parse(readFileSync(`benchmarks/${name}-drivetrain-final.json`, "utf8"))
const balanced = load("balanced")
const heavy = load("heavy")
const maniac = load("maniac")
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

check(balanced.acceleration.zeroTo20?.timeSec < 4.5, "Balanced 0-20 too slow")
check(balanced.acceleration.zeroTo40?.timeSec < 11, "Balanced 0-40 too slow")
check(balanced.acceleration.zeroTo60?.timeSec < 23, "Balanced 0-60 too slow")
check(balanced.topSpeed.peakKmh >= 60 && balanced.topSpeed.peakKmh <= 70, "Balanced top speed outside 60-70 km/h")
check(balanced.braking.dry40to0.reachedStart && balanced.braking.dry60to0.reachedStart, "Balanced braking start speed not reached")
check(balanced.braking.wetDistanceDeltaPct > 10, "Wet braking not meaningfully longer than dry")
check(balanced.braking.lateriteDistanceDeltaPct > balanced.braking.wetDistanceDeltaPct, "Laterite should brake worse than wet")
check(balanced.sustainedTurn.minWheelContacts === 4, "Balanced sustained turn lost wheel contact")
check(balanced.shiftSequenceTiming.fullForwardSequenceReached, "Balanced never reached 6th gear")
check(balanced.shiftSequenceTiming.allWithin250to400ms, "Balanced shift cut outside 250-400 ms")
check(balanced.shiftSequenceTiming.brakingDownshifts.length >= 4, "Balanced automatic downshift sequence incomplete")
check(balanced.reverse.peakReverseKmh <= 14, "Reverse speed too high")
check(balanced.steeringVerification.physicallyCorrect, "Touch steering direction is inverted")
check(balanced.fixedStepDeltas.every((x) => x.positionDeltaM < 0.01 && x.speedDeltaKmh < 0.01 && x.yawDeltaDeg < 0.05), "Fixed-step consistency failed")
check(heavy.topSpeed.peakKmh < balanced.topSpeed.peakKmh, "Heavy should remain slower than Balanced")
check(maniac.acceleration.zeroTo60?.timeSec < balanced.acceleration.zeroTo60?.timeSec, "Maniac should accelerate faster than Balanced")
check(maniac.sustainedTurn.maxRollDeg < 4, "Maniac sustained turn roll exceeds 4 degrees")

if (failures.length) {
  console.error("Benchmark verification FAILED")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("Benchmark verification PASS")
console.log(`Balanced: 0-60 ${balanced.acceleration.zeroTo60.timeSec.toFixed(2)} s, peak ${balanced.topSpeed.peakKmh.toFixed(2)} km/h, 60-0 ${balanced.braking.dry60to0.stopDistanceM.toFixed(2)} m`)
