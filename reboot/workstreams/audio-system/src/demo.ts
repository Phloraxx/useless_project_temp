import "./style.css"
import { AudioEngine } from "./AudioEngine"

type DemoState = {
  gear: number
  normalizedRpm: number
  load: number
  speedKmh: number
  braking: number
  roughness: number
  rain: number
  wiper: number
  interior: number
  surface: string
  shiftEvent: number
}

const state: DemoState = {
  gear: 1,
  normalizedRpm: 0.12,
  load: 0,
  speedKmh: 0,
  braking: 0,
  roughness: 0.08,
  rain: 0,
  wiper: 0,
  interior: 0,
  surface: "asphalt",
  shiftEvent: 0,
}

const engine = new AudioEngine({ assetBaseUrl: "/audio" })
const app = document.querySelector<HTMLDivElement>("#app")!

const slider = (key: keyof DemoState, label: string, min: number, max: number, step: number, suffix = "") => `
  <label class="control">
    <span>${label}<output id="out-${String(key)}"></output></span>
    <input data-key="${String(key)}" type="range" min="${min}" max="${max}" step="${step}" value="${state[key]}" data-suffix="${suffix}" />
  </label>`

app.innerHTML = `
  <main class="shell">
    <header>
      <div><p>അടുത്ത സ്റ്റോപ്പിൽ™ / REBOOT</p><h1>Heavy Bus Audio Lab</h1></div>
      <button id="enable" class="primary">Enable audio</button>
    </header>

    <section class="explain">
      <strong>Test the drivetrain by ear.</strong>
      <span>Raise RPM/load, then press SHIFT and immediately lower RPM. You should hear load rise → torque cut → shift transient → lower-rev engine return.</span>
    </section>

    <div class="grid">
      <section class="panel">
        <h2>Drivetrain telemetry</h2>
        ${slider("normalizedRpm", "Normalized RPM", 0, 1, 0.01)}
        ${slider("load", "Throttle / load", 0, 1, 0.01)}
        ${slider("speedKmh", "Speed", 0, 80, 1, " km/h")}
        ${slider("braking", "Brake pressure", 0, 1, 0.01)}
        <label class="control"><span>Gear <output id="out-gear"></output></span><input data-key="gear" type="range" min="0" max="6" step="1" value="1" /></label>
        <div class="actions"><button id="shift">SHIFT</button><button id="takeoff">Takeoff preset</button><button id="hard-brake">Hard-brake preset</button></div>
      </section>

      <section class="panel">
        <h2>Road + cabin</h2>
        ${slider("roughness", "Surface roughness", 0, 1, 0.01)}
        ${slider("rain", "Rain", 0, 1, 0.01)}
        ${slider("wiper", "Wiper", 0, 1, 0.01)}
        ${slider("interior", "Interior perspective", 0, 1, 0.01)}
        <label class="control"><span>Surface</span><select id="surface"><option>asphalt</option><option>wet</option><option>rough</option><option>laterite</option><option>gravel</option></select></label>
        <label class="control"><span>Day / night ambience</span><input id="night" type="range" min="0" max="1" step="0.01" value="0" /></label>
      </section>

      <section class="panel wide">
        <h2>Bus controls / one-shots</h2>
        <div class="actions wrap">
          <button id="horn-short">Horn tap</button>
          <button id="horn-held">Hold horn</button>
          <button id="bell">Conductor bell</button>
          <button id="door-open">Door open</button>
          <button id="door-close">Door close</button>
        </div>
        <p class="hint">Air-brake release triggers when brake pressure falls from above 0.48 to below 0.14. Brake squeal only triggers on dry asphalt above 24 km/h with panic-brake pressure.</p>
      </section>
    </div>

    <footer><span id="status">Audio not initialised.</span><code>src/AudioEngine.ts</code></footer>
  </main>`

const status = document.querySelector<HTMLSpanElement>("#status")!
const enable = document.querySelector<HTMLButtonElement>("#enable")!
let active = false
let hornHeld = false

function refreshOutputs() {
  document.querySelectorAll<HTMLInputElement>("input[data-key]").forEach((input) => {
    const key = input.dataset.key as keyof DemoState
    const output = document.querySelector<HTMLOutputElement>(`#out-${String(key)}`)
    if (output) output.value = `${Number(state[key]).toFixed(key === "gear" || key === "speedKmh" ? 0 : 2)}${input.dataset.suffix ?? ""}`
  })
}

function push() {
  if (!active) return
  engine.update(state as unknown as Record<string, unknown>)
}

for (const input of document.querySelectorAll<HTMLInputElement>("input[data-key]")) {
  input.addEventListener("input", () => {
    const key = input.dataset.key as keyof DemoState
    ;(state as unknown as Record<string, number>)[key] = Number(input.value)
    refreshOutputs()
    push()
  })
}

function setState(patch: Partial<DemoState>) {
  Object.assign(state, patch)
  for (const [key, value] of Object.entries(patch)) {
    const input = document.querySelector<HTMLInputElement>(`input[data-key="${key}"]`)
    if (input) input.value = String(value)
  }
  refreshOutputs()
  push()
}

refreshOutputs()

enable.addEventListener("click", async () => {
  if (!active) {
    enable.disabled = true
    status.textContent = "Loading 20 processed runtime assets…"
    try {
      await engine.start()
      active = true
      enable.textContent = "Audio active"
      status.textContent = "AudioEngine running. Telemetry is live."
      push()
    } catch (error) {
      status.textContent = `Audio failed: ${error instanceof Error ? error.message : String(error)}`
      enable.disabled = false
    }
  }
})

document.querySelector<HTMLSelectElement>("#surface")!.addEventListener("change", (event) => {
  state.surface = (event.currentTarget as HTMLSelectElement).value
  push()
})
document.querySelector<HTMLInputElement>("#night")!.addEventListener("input", (event) => engine.setAmbienceNight(Number((event.currentTarget as HTMLInputElement).value)))

document.querySelector("#shift")!.addEventListener("click", () => {
  state.shiftEvent += 1
  state.gear = Math.min(6, state.gear + 1)
  setState({ gear: state.gear, shiftEvent: state.shiftEvent })
})
document.querySelector("#takeoff")!.addEventListener("click", () => setState({ gear: 1, normalizedRpm: 0.42, load: 0.78, speedKmh: 7, braking: 0 }))
document.querySelector("#hard-brake")!.addEventListener("click", () => {
  setState({ speedKmh: 52, normalizedRpm: 0.48, load: 0, braking: 0.2, surface: "asphalt" })
  window.setTimeout(() => setState({ braking: 0.97 }), 120)
  window.setTimeout(() => setState({ speedKmh: 16, normalizedRpm: 0.2 }), 900)
  window.setTimeout(() => setState({ braking: 0.05, speedKmh: 5 }), 1400)
})
document.querySelector("#bell")!.addEventListener("click", () => engine.triggerConductorBell())
document.querySelector("#door-open")!.addEventListener("click", () => engine.triggerDoor(true))
document.querySelector("#door-close")!.addEventListener("click", () => engine.triggerDoor(false))
document.querySelector("#horn-short")!.addEventListener("click", () => engine.triggerHornShort())
document.querySelector<HTMLButtonElement>("#horn-held")!.addEventListener("click", (event) => {
  hornHeld = !hornHeld
  engine.setHornHeld(hornHeld)
  ;(event.currentTarget as HTMLButtonElement).textContent = hornHeld ? "Release horn" : "Hold horn"
})

window.setInterval(push, 50)
