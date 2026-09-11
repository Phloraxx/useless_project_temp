# Mixer + Telemetry Contract

## Integration API

Instantiate `AudioEngine`, call `await engine.start()` from a user gesture, then call `engine.update(rawTelemetry)` on the game update cadence. The default adapter deliberately accepts aliases so the physics workstream can rename fields without forcing an audio rewrite. A custom `TelemetryAdapter` can be injected at construction.

Canonical telemetry:

```ts
{
  gear: number,
  rpm: 0..1,
  load: 0..1,
  speedKmh: number,
  braking: 0..1,
  surface: string,
  roughness: 0..1,
  rain: 0..1,
  wiper: 0..1,
  interior: 0..1,
  shiftToken: boolean | number | string | null,
  shifting: boolean | null,
  shiftProgress: number | null
}
```

Physics-workstream-native fields are supported directly: `normalizedRpm`, `drivetrainLoad`, `speedKmh`, `brake`, `surface`, `gear`, `shiftSerial`.

Default aliases: `normalizedRpm | rpm01 | rpm`, `drivetrainLoad | load | throttle | throttle01`, `speedKmh | speedMps | speed` (`speed` defaults to km/h; use `speedUnit: "mps"` when needed), `braking | brake | brake01`, `shiftSerial | shiftEvent | shiftToken | shifting`, plus `shiftProgress` when supplied, `rain | rain01`, `wiper | wiper01`, `interior | interior01`.

## Shift behaviour

A shift is detected primarily from the physics workstream `shiftSerial`; explicit boolean/token events and gear changes remain fallbacks. `bindDrivetrainShiftEvent()` can also listen to the physics `adutha:drivetrain-shift` browser event without double-triggering because of the shift cooldown. When `shifting` + `shiftProgress` exist, the engine torque-audio envelope follows the actual physics shift duration: fast cut-in to ~28%, hold through the torque interruption, then recovery near shift completion. Without progress telemetry, a ~320 ms fallback envelope is used. The real shift transient starts ~45 ms after detection. RPM-layer crossfades then naturally return at the lower post-shift RPM supplied by physics. This is the intended `rev/load rise → torque cut → shift → lower-rev return` sequence.

## Mixer defaults

Bus defaults are exported as `AUDIO_MIXER_DEFAULTS_DB` from `src/AudioEngine.ts`.

| Bus | Default |
|---|---:|
| MASTER | -3 dB |
| VEHICLE_PLAYER | -2 dB |
| VEHICLE_WORLD | -8 dB |
| INTERIOR_MECHANICAL | -8 dB |
| AMBIENCE_BG | -13 dB |
| AMBIENCE_MID | -10 dB |
| FOLEY | -8 dB |
| DIALOGUE_HERO | -2 dB |
| DIALOGUE_BARKS | -6 dB |
| UI | -9 dB |
| MUSIC_STING | -12 dB |

Settings categories: `master`, `effects`, `dialogue`, `ambience`. Hero dialogue automatically ducks ambience to 70% while it is active, then restores smoothly. The engine exposes `getBusInput("DIALOGUE_HERO")` and `getBusInput("DIALOGUE_BARKS")` for the dialogue/localisation workstream.

## Event gating

- Takeoff transient: crossing roughly 1.2 → 2.2 km/h with load > 0.28; 1.5 s cooldown.
- Deceleration-to-idle: RPM crosses below ~0.23 from > 0.36 with low load; 2 s cooldown.
- Air-brake release: braking falls from > 0.48 to < 0.14; 0.85 s cooldown.
- Brake squeal: panic braking > 0.88, speed > 24 km/h, dry/non-loose surface; 2.4 s cooldown.
- Rough-road rattle: continuous gain from `roughness`, with strong fallback values for `rough`/`laterite` surfaces.
- Player horn: separate short tap and held-loop paths.
- Interior perspective: progressively low-passes player engine and mechanical content; exterior world level is reduced from the cabin perspective.
