import { chromium } from "playwright"
import fs from "node:fs/promises"

const browser = await chromium.launch({ headless: true, args: ["--enable-precise-memory-info"] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`)
})
await page.goto("http://127.0.0.1:4175", { waitUntil: "networkidle" })
await page.waitForTimeout(3000)
const samples = []
async function sample(second) {
  const metrics = await page.evaluate(() => ({
    heapUsed: performance.memory?.usedJSHeapSize ?? null,
    heapTotal: performance.memory?.totalJSHeapSize ?? null,
    resources: performance.getEntriesByType("resource").length,
  }))
  samples.push({ second, ...metrics })
  console.log(`sample ${second}s`, metrics)
}

for (const second of [0, 30, 60, 90, 120]) {
  if (second > 0) await page.waitForTimeout(30000)
  await sample(second)
}

const result = {
  durationSeconds: 120,
  environment: "Chromium headless; runtime-stability/heap observation, not GPU benchmark",
  samples,
  errors,
}
await fs.writeFile("performance-observation.json", JSON.stringify(result, null, 2))
await browser.close()
console.log(`runtime errors: ${errors.length}`)
if (errors.length) process.exitCode = 1
