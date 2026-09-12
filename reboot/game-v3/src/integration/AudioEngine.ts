export type MixerBusName =
  | "MASTER"
  | "VEHICLE_PLAYER"
  | "VEHICLE_WORLD"
  | "INTERIOR_MECHANICAL"
  | "AMBIENCE_BG"
  | "AMBIENCE_MID"
  | "FOLEY"
  | "DIALOGUE_HERO"
  | "DIALOGUE_BARKS"
  | "UI"
  | "MUSIC_STING"

export type CanonicalTelemetry = {
  gear: number
  rpm: number
  load: number
  speedKmh: number
  braking: number
  surface: string
  roughness: number
  rain: number
  wiper: number
  interior: number
  shiftToken: string | number | boolean | null
  shifting: boolean | null
  shiftProgress: number | null
}

export type RawTelemetry = Record<string, unknown>
export type TelemetryAdapter = (raw: RawTelemetry) => CanonicalTelemetry

export type AudioMix = {
  master: number
  effects: number
  dialogue: number
  ambience: number
}

export type AudioEngineOptions = {
  assetBaseUrl?: string
  adapter?: TelemetryAdapter
  mix?: Partial<AudioMix>
  context?: AudioContext
}

type LoopVoice = {
  source: AudioBufferSourceNode
  gain: GainNode
  filter?: BiquadFilterNode
}

type OneShotKey =
  | "takeoff"
  | "shift"
  | "toIdle"
  | "airBrake"
  | "brakeSqueal"
  | "bell"
  | "doorOpen"
  | "doorClose"
  | "hornShort"

type BufferKey =
  | "engineIdle"
  | "engineLow"
  | "engineMid"
  | "engineHigh"
  | OneShotKey
  | "hornHeld"
  | "wiper"
  | "road"
  | "rattle"
  | "rain"
  | "ambienceDay"
  | "ambienceNight"

const DEFAULT_ASSETS: Record<BufferKey, string> = {
  engineIdle: "engine-idle.ogg",
  engineLow: "engine-low.ogg",
  engineMid: "engine-mid.ogg",
  engineHigh: "engine-high.ogg",
  takeoff: "engine-takeoff.ogg",
  shift: "gear-shift.ogg",
  toIdle: "engine-to-idle.ogg",
  airBrake: "air-brake-release.ogg",
  brakeSqueal: "brake-squeal.ogg",
  bell: "conductor-bell.ogg",
  doorOpen: "door-open.ogg",
  doorClose: "door-close.ogg",
  hornShort: "horn-short.ogg",
  hornHeld: "horn-held.ogg",
  wiper: "wiper-loop.ogg",
  road: "road-cabin-loop.ogg",
  rattle: "bus-rattle-loop.ogg",
  rain: "rain-roof-loop.ogg",
  ambienceDay: "ambience-kerala-loop.ogg",
  ambienceNight: "ambience-kerala-night-loop.ogg",
}

const BUS_DEFAULT_DB: Record<MixerBusName, number> = {
  MASTER: -3,
  VEHICLE_PLAYER: -2,
  VEHICLE_WORLD: -8,
  INTERIOR_MECHANICAL: -8,
  AMBIENCE_BG: -13,
  AMBIENCE_MID: -10,
  FOLEY: -8,
  DIALOGUE_HERO: -2,
  DIALOGUE_BARKS: -6,
  UI: -9,
  MUSIC_STING: -12,
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
const db = (value: number) => 10 ** (value / 20)
const num = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback
const bool01 = (value: unknown, fallback = 0) => typeof value === "boolean" ? (value ? 1 : 0) : clamp01(num(value, fallback))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / Math.max(0.0001, b - a))
  return t * t * (3 - 2 * t)
}
const triangle = (x: number, center: number, width: number) => clamp01(1 - Math.abs(x - center) / width)

/**
 * Default loose adapter. Integration can replace this without changing AudioEngine.
 * It accepts the physics workstream's proposed names plus common alternatives.
 */
export const defaultTelemetryAdapter: TelemetryAdapter = (raw) => {
  const speedKmh = num(raw.speedKmh, Number.NaN)
  const speedMps = num(raw.speedMps, Number.NaN)
  const plainSpeed = num(raw.speed, 0)
  const speedUnit = raw.speedUnit === "mps" ? "mps" : "kmh"
  const resolvedSpeed = Number.isFinite(speedKmh) ? speedKmh : Number.isFinite(speedMps) ? speedMps * 3.6 : plainSpeed * (speedUnit === "mps" ? 3.6 : 1)
  const surface = typeof raw.surface === "string" ? raw.surface : "asphalt"
  const roughFallback = surface === "laterite" ? 0.9 : surface === "rough" ? 0.75 : surface === "gravel" ? 0.65 : 0.08
  return {
    gear: Math.max(-1, Math.round(num(raw.gear, 0))),
    rpm: clamp01(num(raw.normalizedRpm, num(raw.rpm01, num(raw.rpm, 0)))),
    load: clamp01(num(raw.drivetrainLoad, num(raw.load, num(raw.throttle, num(raw.throttle01, 0))))),
    speedKmh: Math.abs(resolvedSpeed),
    braking: clamp01(num(raw.braking, num(raw.brake, num(raw.brake01, 0)))),
    surface,
    roughness: clamp01(num(raw.roughness, roughFallback)),
    rain: clamp01(num(raw.rain, num(raw.rain01, 0))),
    wiper: bool01(raw.wiper, num(raw.wiper01, 0)),
    interior: bool01(raw.interior, num(raw.interior01, 0)),
    shiftToken: (raw.shiftSerial ?? raw.shiftEvent ?? raw.shiftToken ?? (raw.shifting === true ? true : null)) as string | number | boolean | null,
    shifting: typeof raw.shifting === "boolean" ? raw.shifting : null,
    shiftProgress: typeof raw.shiftProgress === "number" && Number.isFinite(raw.shiftProgress) ? clamp01(raw.shiftProgress) : null,
  }
}

export type AudioEventFlags = {
  shift: boolean
  takeoff: boolean
  toIdle: boolean
  airBrake: boolean
  brakeSqueal: boolean
}

export function detectAudioEventFlags(
  current: CanonicalTelemetry,
  previous: CanonicalTelemetry | null,
  lastShiftToken: CanonicalTelemetry["shiftToken"],
): AudioEventFlags {
  if (!previous) return { shift: false, takeoff: false, toIdle: false, airBrake: false, brakeSqueal: false }
  const explicitShift = current.shiftToken === true && lastShiftToken !== true
  const tokenShift = current.shiftToken !== null && typeof current.shiftToken !== "boolean" && current.shiftToken !== lastShiftToken
  const gearShift = current.gear !== previous.gear && Math.abs(current.gear - previous.gear) <= 2
  return {
    shift: explicitShift || tokenShift || gearShift,
    takeoff: previous.speedKmh < 1.2 && current.speedKmh > 2.2 && current.load > 0.28,
    toIdle: previous.rpm > 0.36 && current.rpm < 0.23 && current.load < 0.18,
    airBrake: previous.braking > 0.48 && current.braking < 0.14,
    brakeSqueal: current.braking > 0.88 && current.speedKmh > 24 && !["wet", "gravel", "laterite"].includes(current.surface) && previous.braking <= 0.88,
  }
}

export class AudioEngine {
  readonly context: AudioContext
  private readonly assetBaseUrl: string
  private readonly adapter: TelemetryAdapter
  private readonly buffers = new Map<BufferKey, AudioBuffer>()
  private readonly buses = new Map<MixerBusName, GainNode>()
  private readonly category = new Map<"effects" | "dialogue" | "ambience", GainNode>()
  private readonly loops = new Map<string, LoopVoice>()

  private enginePerspective!: BiquadFilterNode
  private engineTorque!: GainNode
  private mechanicalPerspective!: BiquadFilterNode
  private worldPerspective!: GainNode

  private mix: AudioMix = { master: 1, effects: 1, dialogue: 1, ambience: 1 }
  private ready = false
  private loadPromise: Promise<void> | null = null
  private running = false
  private last: CanonicalTelemetry | null = null
  private lastShiftToken: CanonicalTelemetry["shiftToken"] = null
  private lastShiftAt = -Infinity
  private lastTakeoffAt = -Infinity
  private lastToIdleAt = -Infinity
  private lastAirBrakeAt = -Infinity
  private lastSquealAt = -Infinity
  private hornHeldVoice: LoopVoice | null = null
  private dialogueDuckDepth = 0

  constructor(options: AudioEngineOptions = {}) {
    this.context = options.context ?? new AudioContext({ latencyHint: "interactive" })
    this.assetBaseUrl = (options.assetBaseUrl ?? "/audio").replace(/\/$/, "")
    this.adapter = options.adapter ?? defaultTelemetryAdapter
    this.mix = { ...this.mix, ...options.mix }
    this.createMixer()
  }

  private createMixer() {
    const master = this.context.createGain()
    master.gain.value = db(BUS_DEFAULT_DB.MASTER) * this.mix.master
    master.connect(this.context.destination)
    this.buses.set("MASTER", master)

    for (const name of ["effects", "dialogue", "ambience"] as const) {
      const gain = this.context.createGain()
      gain.gain.value = this.mix[name]
      gain.connect(master)
      this.category.set(name, gain)
    }

    const categoryFor = (name: MixerBusName) => {
      if (name.startsWith("DIALOGUE_")) return "dialogue" as const
      if (name.startsWith("AMBIENCE_")) return "ambience" as const
      return "effects" as const
    }
    ;(Object.keys(BUS_DEFAULT_DB) as MixerBusName[]).filter((name) => name !== "MASTER").forEach((name) => {
      const gain = this.context.createGain()
      gain.gain.value = db(BUS_DEFAULT_DB[name])
      gain.connect(this.category.get(categoryFor(name))!)
      this.buses.set(name, gain)
    })

    this.engineTorque = this.context.createGain()
    this.engineTorque.gain.value = 1
    this.enginePerspective = this.context.createBiquadFilter()
    this.enginePerspective.type = "lowpass"
    this.enginePerspective.frequency.value = 12000
    this.engineTorque.connect(this.enginePerspective).connect(this.bus("VEHICLE_PLAYER"))

    this.mechanicalPerspective = this.context.createBiquadFilter()
    this.mechanicalPerspective.type = "lowpass"
    this.mechanicalPerspective.frequency.value = 9000
    this.mechanicalPerspective.connect(this.bus("INTERIOR_MECHANICAL"))

    this.worldPerspective = this.context.createGain()
    this.worldPerspective.gain.value = 1
    this.worldPerspective.connect(this.bus("VEHICLE_WORLD"))
  }

  private bus(name: MixerBusName) {
    const node = this.buses.get(name)
    if (!node) throw new Error(`Mixer bus ${name} is not available`)
    return node
  }

  async load() {
    if (this.ready) return
    if (this.loadPromise) return this.loadPromise
    this.loadPromise = Promise.all((Object.entries(DEFAULT_ASSETS) as Array<[BufferKey, string]>).map(async ([key, file]) => {
      const response = await fetch(`${this.assetBaseUrl}/${file}`)
      if (!response.ok) throw new Error(`Audio asset failed: ${file} (${response.status})`)
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer())
      this.buffers.set(key, buffer)
    })).then(() => { this.ready = true }).finally(() => { this.loadPromise = null })
    return this.loadPromise
  }

  async start() {
    // Resume immediately while this call is still inside the user's gesture.
    await this.context.resume()
    await this.load()
    if (this.context.state !== "running") await this.context.resume()
    if (!this.running) this.startLoops()
    this.running = true
  }

  async suspend() {
    await this.context.suspend()
  }

  private makeLoop(key: BufferKey, destination: AudioNode, initialGain = 0, rate = 1, filter?: BiquadFilterNode) {
    const buffer = this.buffers.get(key)
    if (!buffer) throw new Error(`Missing decoded buffer: ${key}`)
    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.playbackRate.value = rate
    const gain = this.context.createGain()
    gain.gain.value = initialGain
    source.connect(gain)
    if (filter) gain.connect(filter)
    else gain.connect(destination)
    source.start()
    return { source, gain, filter } satisfies LoopVoice
  }

  private startLoops() {
    this.loops.set("engineIdle", this.makeLoop("engineIdle", this.engineTorque, 0))
    this.loops.set("engineLow", this.makeLoop("engineLow", this.engineTorque, 0))
    this.loops.set("engineMid", this.makeLoop("engineMid", this.engineTorque, 0))
    this.loops.set("engineHigh", this.makeLoop("engineHigh", this.engineTorque, 0))
    this.loops.set("road", this.makeLoop("road", this.mechanicalPerspective, 0))
    this.loops.set("rattle", this.makeLoop("rattle", this.mechanicalPerspective, 0))
    this.loops.set("rain", this.makeLoop("rain", this.mechanicalPerspective, 0))
    this.loops.set("wiper", this.makeLoop("wiper", this.mechanicalPerspective, 0))
    this.loops.set("ambienceDay", this.makeLoop("ambienceDay", this.bus("AMBIENCE_BG"), 0.18))
    this.loops.set("ambienceNight", this.makeLoop("ambienceNight", this.bus("AMBIENCE_BG"), 0))
  }

  update(raw: RawTelemetry, _dtSeconds = 1 / 60) {
    if (!this.running) return
    const t = this.adapter(raw)
    const now = this.context.currentTime
    const previous = this.last

    this.updateEngine(t, now)
    this.updateShiftTorque(t, previous, now)
    this.updateRoadAndBody(t, now)
    this.updateWeather(t, now)
    this.updatePerspective(t.interior, now)
    this.detectEvents(t, previous, now)

    this.last = t
    this.lastShiftToken = t.shiftToken
  }

  private updateEngine(t: CanonicalTelemetry, now: number) {
    const rpm = t.rpm
    const load = t.load
    let idle = triangle(rpm, 0.08, 0.24) * (0.86 - load * 0.18)
    let low = triangle(rpm, 0.31, 0.27) * (0.72 + load * 0.26)
    let mid = triangle(rpm, 0.57, 0.30) * (0.68 + load * 0.35)
    let high = triangle(rpm, 0.86, 0.29) * (0.48 + load * 0.58)
    if (rpm < 0.06) idle = Math.max(idle, 0.58)

    const sum = Math.max(1, idle + low + mid + high)
    ;(["engineIdle", "engineLow", "engineMid", "engineHigh"] as const).forEach((key, index) => {
      const value = [idle, low, mid, high][index] / sum
      const voice = this.loops.get(key)
      if (!voice) return
      voice.gain.gain.setTargetAtTime(value * 0.92, now, 0.055)
    })

    // Small playback-rate motion only within each matched recording region. Layer selection does the real work.
    const rates = [0.985 + rpm * 0.025, 0.985 + rpm * 0.045, 0.98 + rpm * 0.055, 0.985 + rpm * 0.045]
    ;(["engineIdle", "engineLow", "engineMid", "engineHigh"] as const).forEach((key, index) => {
      this.loops.get(key)?.source.playbackRate.setTargetAtTime(rates[index], now, 0.09)
    })
  }

  private updateShiftTorque(t: CanonicalTelemetry, previous: CanonicalTelemetry | null, now: number) {
    if (t.shifting === null) return
    const gain = this.engineTorque.gain
    if (t.shifting) {
      const progress = t.shiftProgress ?? 0.45
      const cutIn = 1 - smoothstep(0, 0.12, progress) * 0.72
      const recover = 0.28 + smoothstep(0.72, 1, progress) * 0.72
      const envelope = progress < 0.12 ? cutIn : progress < 0.72 ? 0.28 : recover
      gain.cancelScheduledValues(now)
      gain.setTargetAtTime(envelope, now, 0.012)
      return
    }
    if (previous?.shifting === true) {
      gain.cancelScheduledValues(now)
      gain.setTargetAtTime(1, now, 0.035)
    }
  }

  private updateRoadAndBody(t: CanonicalTelemetry, now: number) {
    const speed = clamp01(t.speedKmh / 72)
    const moving = smoothstep(3, 14, t.speedKmh)
    const wetBoost = t.surface === "wet" ? 1.18 : 1
    const roadGain = moving * (0.08 + speed * 0.48) * wetBoost
    const rough = clamp01(Math.max(t.roughness, t.surface === "laterite" ? 0.9 : t.surface === "rough" ? 0.75 : 0))
    const rattleGain = moving * rough * (0.12 + speed * 0.34)
    const road = this.loops.get("road")
    const rattle = this.loops.get("rattle")
    if (road) {
      road.gain.gain.setTargetAtTime(roadGain, now, 0.12)
      road.source.playbackRate.setTargetAtTime(0.96 + speed * 0.08, now, 0.25)
    }
    if (rattle) {
      rattle.gain.gain.setTargetAtTime(rattleGain, now, 0.08)
      rattle.source.playbackRate.setTargetAtTime(0.98 + speed * 0.04, now, 0.18)
    }
  }

  private updateWeather(t: CanonicalTelemetry, now: number) {
    const rain = this.loops.get("rain")
    const wiper = this.loops.get("wiper")
    if (rain) rain.gain.gain.setTargetAtTime(t.rain * 0.78, now, 0.35)
    if (wiper) {
      wiper.gain.gain.setTargetAtTime(t.wiper * 0.72, now, 0.10)
      wiper.source.playbackRate.setTargetAtTime(0.92 + t.wiper * 0.18, now, 0.22)
    }
  }

  private updatePerspective(interior: number, now: number) {
    const cabin = clamp01(interior)
    const engineHz = 12000 - cabin * 8800
    const mechHz = 10000 - cabin * 2500
    this.enginePerspective.frequency.setTargetAtTime(engineHz, now, 0.18)
    this.mechanicalPerspective.frequency.setTargetAtTime(mechHz, now, 0.18)
    this.worldPerspective.gain.setTargetAtTime(1 - cabin * 0.58, now, 0.18)
  }

  private detectEvents(t: CanonicalTelemetry, previous: CanonicalTelemetry | null, now: number) {
    const events = detectAudioEventFlags(t, previous, this.lastShiftToken)
    if (events.shift && now - this.lastShiftAt > 0.18) this.triggerShift()
    if (events.takeoff && now - this.lastTakeoffAt > 1.5) {
      this.playOneShot("takeoff", "VEHICLE_PLAYER", 0.54)
      this.lastTakeoffAt = now
    }
    if (events.toIdle && now - this.lastToIdleAt > 2.0) {
      this.playOneShot("toIdle", "VEHICLE_PLAYER", 0.42)
      this.lastToIdleAt = now
    }
    if (events.airBrake && now - this.lastAirBrakeAt > 0.85) {
      this.playOneShot("airBrake", "INTERIOR_MECHANICAL", 0.72)
      this.lastAirBrakeAt = now
    }
    if (events.brakeSqueal && now - this.lastSquealAt > 2.4) {
      this.playOneShot("brakeSqueal", "VEHICLE_WORLD", 0.28)
      this.lastSquealAt = now
    }
  }

  bindDrivetrainShiftEvent(target: EventTarget = window) {
    const listener = () => {
      const now = this.context.currentTime
      if (this.running && now - this.lastShiftAt > 0.18) this.triggerShift()
    }
    target.addEventListener("adutha:drivetrain-shift", listener)
    return () => target.removeEventListener("adutha:drivetrain-shift", listener)
  }

  triggerShift() {
    if (!this.running) return
    const now = this.context.currentTime
    const g = this.engineTorque.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(Math.max(0.2, g.value), now)
    g.linearRampToValueAtTime(0.28, now + 0.055)
    g.setValueAtTime(0.28, now + 0.12)
    g.linearRampToValueAtTime(1, now + 0.32)
    this.playOneShot("shift", "VEHICLE_PLAYER", 0.78, 1, now + 0.045)
    this.lastShiftAt = now
  }

  triggerConductorBell(count = 1) {
    const now = this.context.currentTime
    for (let i = 0; i < Math.min(3, Math.max(1, count)); i += 1) {
      this.playOneShot("bell", "INTERIOR_MECHANICAL", 0.72, 1, now + i * 0.28)
    }
  }

  triggerDoor(open: boolean) {
    this.playOneShot(open ? "doorOpen" : "doorClose", "INTERIOR_MECHANICAL", 0.74)
  }

  triggerHornShort() {
    this.playOneShot("hornShort", "VEHICLE_PLAYER", 0.82)
  }

  setHornHeld(active: boolean) {
    if (!this.running) return
    const now = this.context.currentTime
    if (active && !this.hornHeldVoice) {
      const voice = this.makeLoop("hornHeld", this.bus("VEHICLE_PLAYER"), 0)
      voice.gain.gain.setValueAtTime(0, now)
      voice.gain.gain.linearRampToValueAtTime(0.76, now + 0.045)
      this.hornHeldVoice = voice
      return
    }
    if (!active && this.hornHeldVoice) {
      const voice = this.hornHeldVoice
      voice.gain.gain.cancelScheduledValues(now)
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
      voice.gain.gain.linearRampToValueAtTime(0, now + 0.07)
      voice.source.stop(now + 0.09)
      this.hornHeldVoice = null
    }
  }

  setAmbienceNight(night: number) {
    if (!this.running) return
    const now = this.context.currentTime
    const value = clamp01(night)
    this.loops.get("ambienceDay")?.gain.gain.setTargetAtTime((1 - value) * 0.18, now, 0.6)
    this.loops.get("ambienceNight")?.gain.gain.setTargetAtTime(value * 0.19, now, 0.6)
  }

  setMix(next: Partial<AudioMix>) {
    this.mix = { ...this.mix, ...next }
    const now = this.context.currentTime
    this.bus("MASTER").gain.setTargetAtTime(db(BUS_DEFAULT_DB.MASTER) * this.mix.master, now, 0.04)
    this.category.get("effects")!.gain.setTargetAtTime(this.mix.effects, now, 0.04)
    this.category.get("dialogue")!.gain.setTargetAtTime(this.mix.dialogue, now, 0.04)
    if (this.dialogueDuckDepth === 0) this.category.get("ambience")!.gain.setTargetAtTime(this.mix.ambience, now, 0.08)
  }

  /** Destination for dialogue/localisation and other workstreams. */
  getBusInput(name: MixerBusName): AudioNode {
    return this.bus(name)
  }

  playDialogue(buffer: AudioBuffer, hero = true, gain = 1) {
    if (!this.running) return null
    const source = this.context.createBufferSource()
    const level = this.context.createGain()
    source.buffer = buffer
    level.gain.value = gain
    source.connect(level).connect(this.bus(hero ? "DIALOGUE_HERO" : "DIALOGUE_BARKS"))
    this.beginDialogueDuck(buffer.duration)
    source.start()
    return source
  }

  private beginDialogueDuck(durationSeconds: number) {
    const ambience = this.category.get("ambience")!
    const now = this.context.currentTime
    this.dialogueDuckDepth += 1
    ambience.gain.cancelScheduledValues(now)
    ambience.gain.setTargetAtTime(this.mix.ambience * 0.70, now, 0.08)
    window.setTimeout(() => {
      this.dialogueDuckDepth = Math.max(0, this.dialogueDuckDepth - 1)
      if (this.dialogueDuckDepth === 0) ambience.gain.setTargetAtTime(this.mix.ambience, this.context.currentTime, 0.16)
    }, Math.ceil((durationSeconds + 0.15) * 1000))
  }

  private playOneShot(key: OneShotKey, busName: MixerBusName, gainValue: number, rate = 1, when = this.context.currentTime) {
    const buffer = this.buffers.get(key)
    if (!buffer) return null
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    source.buffer = buffer
    source.playbackRate.value = rate
    gain.gain.value = gainValue
    const destination = busName === "VEHICLE_WORLD" ? this.worldPerspective : this.bus(busName)
    source.connect(gain).connect(destination)
    source.start(when)
    return source
  }

  destroy() {
    this.setHornHeld(false)
    for (const voice of this.loops.values()) {
      try { voice.source.stop() } catch { /* already stopped */ }
    }
    this.loops.clear()
    this.running = false
    void this.context.close()
  }
}

export const AUDIO_MIXER_DEFAULTS_DB = { ...BUS_DEFAULT_DB }
export const AUDIO_RUNTIME_FILENAMES = { ...DEFAULT_ASSETS }
