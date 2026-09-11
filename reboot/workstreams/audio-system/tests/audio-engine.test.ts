import test from "node:test"
import assert from "node:assert/strict"
import {
  defaultTelemetryAdapter,
  detectAudioEventFlags,
  type CanonicalTelemetry,
} from "../src/AudioEngine"

const base = (overrides: Partial<CanonicalTelemetry> = {}): CanonicalTelemetry => ({
  gear: 1,
  rpm: 0.18,
  load: 0,
  speedKmh: 0,
  braking: 0,
  surface: "asphalt",
  roughness: 0.08,
  rain: 0,
  wiper: 0,
  interior: 0,
  shiftToken: 0,
  shifting: null,
  shiftProgress: null,
  ...overrides,
})

test("maps the physics workstream telemetry exactly", () => {
  const mapped = defaultTelemetryAdapter({
    speedKmh: -12.5,
    gear: 3,
    normalizedRpm: 0.73,
    drivetrainLoad: 0.64,
    brake: 0.22,
    surface: "rough",
    shifting: true,
    shiftSerial: 7,
  })
  assert.equal(mapped.speedKmh, 12.5)
  assert.equal(mapped.gear, 3)
  assert.equal(mapped.rpm, 0.73)
  assert.equal(mapped.load, 0.64)
  assert.equal(mapped.braking, 0.22)
  assert.equal(mapped.roughness, 0.75)
  assert.equal(mapped.shiftToken, 7)
  assert.equal(mapped.shifting, true)
  assert.equal(mapped.shiftProgress, null)
})

test("plain speed defaults to km/h and speedMps converts", () => {
  assert.equal(defaultTelemetryAdapter({ speed: 10 }).speedKmh, 10)
  assert.equal(defaultTelemetryAdapter({ speed: 10, speedUnit: "mps" }).speedKmh, 36)
  assert.equal(defaultTelemetryAdapter({ speedMps: -5 }).speedKmh, 18)
})

test("shift serial change is authoritative", () => {
  const previous = base({ gear: 2, shiftToken: 12 })
  const current = base({ gear: 2, shiftToken: 13 })
  assert.equal(detectAudioEventFlags(current, previous, 12).shift, true)
  assert.equal(detectAudioEventFlags(current, previous, 13).shift, false)
})

test("boolean shift is rising-edge only", () => {
  const previous = base({ gear: 2, shiftToken: false })
  const current = base({ gear: 2, shiftToken: true })
  assert.equal(detectAudioEventFlags(current, previous, false).shift, true)
  assert.equal(detectAudioEventFlags(previous, current, true).shift, false)
})

test("takeoff, idle-return and air-brake gates are deterministic", () => {
  assert.equal(
    detectAudioEventFlags(base({ speedKmh: 3, load: 0.5 }), base({ speedKmh: 0.5 }), 0).takeoff,
    true,
  )
  assert.equal(
    detectAudioEventFlags(base({ rpm: 0.2, load: 0.1 }), base({ rpm: 0.5, load: 0.4 }), 0).toIdle,
    true,
  )
  assert.equal(
    detectAudioEventFlags(base({ braking: 0.05 }), base({ braking: 0.8 }), 0).airBrake,
    true,
  )
})

test("brake squeal only gates for a fast dry panic stop", () => {
  const previous = base({ speedKmh: 45, braking: 0.4 })
  const dry = base({ speedKmh: 45, braking: 0.95, surface: "asphalt" })
  const wet = base({ speedKmh: 45, braking: 0.95, surface: "wet" })
  const slow = base({ speedKmh: 18, braking: 0.95, surface: "asphalt" })
  assert.equal(detectAudioEventFlags(dry, previous, 0).brakeSqueal, true)
  assert.equal(detectAudioEventFlags(wet, previous, 0).brakeSqueal, false)
  assert.equal(detectAudioEventFlags(slow, previous, 0).brakeSqueal, false)
})
