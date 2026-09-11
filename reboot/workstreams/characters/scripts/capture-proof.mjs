import { chromium } from "playwright"
import fs from "node:fs/promises"

const base = process.env.CHARACTER_PROOF_URL ?? "http://127.0.0.1:4175"
const shots = "screenshots/final"
const videos = "captures"
await fs.mkdir(shots, { recursive: true })
await fs.mkdir(videos, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: videos, size: { width: 1280, height: 720 } },
})
const page = await context.newPage()
const errors = []
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`)
})

async function reset(wait = 1200) {
  await page.goto(base, { waitUntil: "networkidle" })
  await page.waitForTimeout(wait)
}
await reset()
await page.screenshot({ path: `${shots}/01-examiner-idle.png` })
await page.waitForTimeout(3400)
await page.screenshot({ path: `${shots}/02-examiner-talk.png` })

await reset(800)
await page.getByRole("button", { name: /conductor/i }).click()
await page.waitForTimeout(4700)
await page.screenshot({ path: `${shots}/03-conductor-talk.png` })

await reset(500)
await page.getByRole("button", { name: /doorway/i }).click()
await page.waitForTimeout(2700)
await page.screenshot({ path: `${shots}/04-doorway-boarding.png` })

await reset(500)
await page.getByRole("button", { name: /aisle/i }).click()
await page.waitForTimeout(8200)
await page.screenshot({ path: `${shots}/05-aisle-seated.png` })

await reset(300)
await page.waitForTimeout(3500)
await page.getByRole("button", { name: /conductor/i }).click()
await page.waitForTimeout(4200)
await page.getByRole("button", { name: /doorway/i }).click()
await page.waitForTimeout(4300)
await page.getByRole("button", { name: /aisle/i }).click()
await page.waitForTimeout(4200)
const video = page.video()
await page.close()
await context.close()
if (video) await video.saveAs(`${videos}/character-animation-proof.webm`)
await browser.close()

console.log(`capture errors: ${errors.length}`)
for (const error of errors) console.log(error)
if (errors.length) process.exitCode = 1
