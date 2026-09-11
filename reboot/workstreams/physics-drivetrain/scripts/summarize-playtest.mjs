import fs from "node:fs"

const file = process.argv[2]
if (!file) {
  console.error("Usage: node scripts/summarize-playtest.mjs <session.json>")
  process.exit(1)
}

const session = JSON.parse(fs.readFileSync(file, "utf8"))
console.log(`Session: ${session.createdAt ?? "unknown"}`)
if (session.viewport) {
  console.log(`Viewport: ${session.viewport.width}x${session.viewport.height} @ ${session.viewport.dpr}x`)
}
console.log(`Pointer: ${session.coarsePointer ? "coarse/touch" : "fine"}`)
console.log("")

for (const run of session.runs ?? []) {
  console.log(`Candidate ${run.candidate} = ${run.preset}`)
  console.log(`  duration: ${run.durationSec.toFixed(1)}s`)
  console.log(`  speed/distance: ${run.maxSpeed.toFixed(1)} km/h / ${run.distance.toFixed(1)} m`)
  console.log(`  corrections: ${run.steeringCorrections}`)
  console.log(`  body roll/pitch: ${run.maxBodyRoll.toFixed(1)}° / ${run.maxBodyPitch.toFixed(1)}°`)
  console.log(`  accel long/lat: ${run.maxLongAccel.toFixed(2)} / ${run.maxLatAccel.toFixed(2)} m/s²`)
  console.log(`  min wheel contacts: ${run.minContacts}`)
  console.log(`  wet/laterite/rough: ${run.wetSeconds.toFixed(1)}s / ${run.lateriteSeconds.toFixed(1)}s / ${run.roughSeconds.toFixed(1)}s`)
  console.log(`  fps avg/min: ${(run.avgFps ?? 0).toFixed(1)} / ${(run.minFps ?? 0).toFixed(1)}`)
  console.log(`  tags: ${(run.tags ?? []).join(", ") || "none"}`)
  if (run.notes) console.log(`  note: ${run.notes}`)
  if ((run.avgFps ?? 60) < 45 || (run.minFps ?? 60) < 30) {
    console.log("  ⚠ performance may be affecting handling judgement")
  }
  console.log("")
}
