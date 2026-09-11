import { chromium } from "playwright"
import { writeFile } from "node:fs/promises"

const URL = process.env.CHARACTER_PROOF_URL ?? "http://127.0.0.1:4185/?stress=1"
const durationSeconds = Number(process.env.STRESS_SECONDS ?? 900)
const sampleEverySeconds = Number(process.env.SAMPLE_SECONDS ?? 60)
const browser = await chromium.launch({ headless: true, args: ["--enable-precise-memory-info"] })
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
const errors = []
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`) })
await page.goto(URL, { waitUntil: "networkidle" })
await page.waitForTimeout(5000)

const samples = []
for (let second = 0; second <= durationSeconds; second += sampleEverySeconds) {
  await cdp.send("HeapProfiler.collectGarbage")
  const sample = await page.evaluate(() => ({
    heapUsed: performance.memory?.usedJSHeapSize ?? null,
    heapTotal: performance.memory?.totalJSHeapSize ?? null,
    resources: performance.getEntriesByType("resource").length,
  }))
  samples.push({ second, ...sample })
  console.log("sample", second, sample)
  if (second < durationSeconds) await page.waitForTimeout(sampleEverySeconds * 1000)
}
const result = {
  durationSeconds,
  sampleEverySeconds,
  churn: "12 ↔ 4 passenger instances every 1.5 s; new keys force mixer/object mount+dispose",
  samples,
  errors,
}
await writeFile("stress-leak-15m.json", JSON.stringify(result, null, 2))
console.log("runtime errors:", errors.length)
await browser.close()
if (errors.length) process.exitCode = 1
