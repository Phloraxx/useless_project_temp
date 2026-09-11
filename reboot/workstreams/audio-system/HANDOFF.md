# AUDIO SYSTEM HANDOFF — അടുത്ത സ്റ്റോപ്പിൽ™

**Workstream:** `/home/drvij/projects/adutha-stoppil/reboot/workstreams/audio-system`  
**Status:** isolated prototype complete; R1/R2 untouched  
**Validated:** 2026-09-12

## What is implemented

`src/AudioEngine.ts` is a reusable Web Audio engine driven by telemetry rather than a single globally pitch-shifted loop. It implements four continuously crossfaded engine regions (idle / low / mid / high-load), takeoff and return-to-idle transients, a real gear-shift one-shot with scheduled torque/audio cut, road/cabin noise, rough-road bus rattle, air-brake release, context-gated hard-brake squeal, short/held horn paths, conductor bell, door open/close, wipers, roof rain, Kerala roadside ambience, day/night ambience crossfade, dialogue routing/ducking, and interior/exterior low-pass perspective treatment.

The intended shift sequence is explicit: **rev/load rises → engine group falls to ~28% → shift transient starts → engine group follows physics `shiftProgress` through the torque cut → returns as normalized RPM lands in the lower layer**. A ~320 ms fallback is retained for integrations that expose only a shift event. Playback-rate movement inside each engine sample is deliberately small; layer selection/crossfade carries the RPM identity.

## Integration

```ts
import { AudioEngine } from "./AudioEngine"

const audio = new AudioEngine({ assetBaseUrl: "/audio" })
await audio.start() // call from a user gesture
// each update / telemetry tick:
audio.update(physicsTelemetry)
```

The default adapter accepts aliases: `normalizedRpm | rpm01 | rpm`, `drivetrainLoad | load | throttle | throttle01`, `speedKmh | speedMps | speed` (`speed` defaults to km/h; use `speedUnit: "mps"` when needed), `braking | brake | brake01`, `shiftSerial | shiftEvent | shiftToken | shifting`, plus `shiftProgress` when supplied, `rain | rain01`, `wiper | wiper01`, `interior | interior01`. A custom adapter can be injected if the physics contract changes more substantially. See `MIXER_AND_TELEMETRY.md`.

Explicit controls exposed: `triggerShift()`, `triggerConductorBell(count)`, `triggerDoor(open)`, `triggerHornShort()`, `setHornHeld(active)`, `setAmbienceNight(0..1)`, `setMix(...)`, `getBusInput(...)`, and `playDialogue(...)`.

## Mixer defaults

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

User-facing categories are master/effects/dialogue/ambience. Hero dialogue ducks ambience to 70% rather than muting the world.

## Telemetry event mapping

- **Takeoff:** crosses ~1.2 → 2.2 km/h with load > 0.28; cooldown 1.5 s.
- **Shift:** explicit changing shift token/event or gear change; torque-cut envelope + recorded shift transient.
- **Return to idle:** normalized RPM drops below ~0.23 from > 0.36 with low load; cooldown 2 s.
- **Air brake:** brake pressure falls from > 0.48 to < 0.14; intended as release hiss.
- **Hard-brake squeal:** brake > 0.88, speed > 24 km/h, dry/non-loose surface only; cooldown 2.4 s.
- **Road:** speed-driven; wet surface modestly raises road layer.
- **Rattle:** speed × `roughness`; `rough`/`laterite` provide fallback roughness if physics has not supplied a value.
- **Rain/wipers:** continuous 0..1 telemetry gains.
- **Perspective:** `interior=0..1`; progressively low-passes player engine/mechanical content and attenuates exterior-world contribution.

## Runtime files

All processed runtime files are OGG/Vorbis at **48 kHz**. Engine/mechanical one-shots are mono; broad ambience/road/rain/rattle beds remain stereo. `runtime/SHA256SUMS.txt` covers the set.

| Runtime file | Rate | Ch | Duration |
|---|---:|---:|---:|
| `air-brake-release.ogg` | 48000 Hz | 1 | 2.30 s |
| `ambience-kerala-loop.ogg` | 48000 Hz | 2 | 57.00 s |
| `ambience-kerala-night-loop.ogg` | 48000 Hz | 2 | 45.60 s |
| `brake-squeal.ogg` | 48000 Hz | 1 | 2.00 s |
| `bus-rattle-loop.ogg` | 48000 Hz | 2 | 38.00 s |
| `conductor-bell.ogg` | 48000 Hz | 1 | 2.32 s |
| `door-close.ogg` | 48000 Hz | 1 | 5.55 s |
| `door-open.ogg` | 48000 Hz | 1 | 1.72 s |
| `engine-high.ogg` | 48000 Hz | 1 | 0.89 s |
| `engine-idle.ogg` | 48000 Hz | 1 | 9.20 s |
| `engine-low.ogg` | 48000 Hz | 1 | 1.58 s |
| `engine-mid.ogg` | 48000 Hz | 1 | 3.67 s |
| `engine-takeoff.ogg` | 48000 Hz | 1 | 3.38 s |
| `engine-to-idle.ogg` | 48000 Hz | 1 | 5.88 s |
| `gear-shift.ogg` | 48000 Hz | 1 | 0.98 s |
| `horn-held.ogg` | 48000 Hz | 1 | 6.60 s |
| `horn-short.ogg` | 48000 Hz | 1 | 1.35 s |
| `rain-roof-loop.ogg` | 48000 Hz | 2 | 57.00 s |
| `road-cabin-loop.ogg` | 48000 Hz | 2 | 57.60 s |
| `wiper-loop.ogg` | 48000 Hz | 1 | 13.50 s |

`public/audio/` is an exact demo/build mirror of these runtime assets. `scripts/process_audio.sh` regenerates the runtime set from preserved raw previews using ffmpeg, conservative loudness targets, trim/fades, mono/stereo policy and baked loop-seam crossfades.

## Complete runtime source / license mapping

Every source in the table below was checked on its Freesound source page on **2026-09-12**. The page displayed **Creative Commons 0 / CC0 1.0**. The preserved local raw files are Freesound public HQ MP3 previews of those source recordings; they are not mislabelled as the original downloadable WAV/FLAC.

| Source URL | Author / source | License | Raw preview | Exact runtime filename(s) |
|---|---|---|---|---|
| https://freesound.org/s/803762/ | Mihacappy — bus_idle_long.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-idle-803762.mp3` | `engine-idle.ogg` |
| https://freesound.org/s/803767/ | Mihacappy — buslow2.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-low-803767.mp3` | `engine-low.ogg` |
| https://freesound.org/s/803761/ | Mihacappy — busmid.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-mid-803761.mp3` | `engine-mid.ogg` |
| https://freesound.org/s/803766/ | Mihacappy — bushigh2.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-high-803766.mp3` | `engine-high.ogg` |
| https://freesound.org/s/803763/ | Mihacappy — bus_takeoff.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-takeoff-803763.mp3` | `engine-takeoff.ogg` |
| https://freesound.org/s/803768/ | Mihacappy — busshift.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-shift-803768.mp3` | `gear-shift.ogg` |
| https://freesound.org/s/803764/ | Mihacappy — bus_to_idle.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-to-idle-803764.mp3` | `engine-to-idle.ogg` |
| https://freesound.org/s/801435/ | okpato123 — air brake sound effect | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `air-brake-801435.mp3` | `air-brake-release.ogg` |
| https://freesound.org/s/104026/ | RutgerMuller — Tires Squeaking.aif | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `brake-squeal-104026.mp3` | `brake-squeal.ogg` |
| https://freesound.org/s/451697/ | kyles — school bus truck int horn honk.flac | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `horn-heavy-bus-451697.mp3` | `horn-short.ogg`<br>`horn-held.ogg` |
| https://freesound.org/s/475211/ | peteberry007 — routemaster bell nice.mp3 | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `conductor-bell-475211.mp3` | `conductor-bell.ogg` |
| https://freesound.org/s/446458/ | UsuarioLeal — 27-Puertas_bus.wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `door-open-446458.mp3` | `door-open.ogg` |
| https://freesound.org/s/837919/ | drrumi — Bus door closing 1 9 | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `door-close-837919.mp3` | `door-close.ogg` |
| https://freesound.org/s/50768/ | RutgerMuller — Windshield Wiper In Car.mp3 | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `wiper-interior-50768.mp3` | `wiper-loop.ogg` |
| https://freesound.org/s/650774/ | Borgory — Rain on car roof interior / Regen auf Autodach | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `rain-roof-interior-650774.mp3` | `rain-roof-loop.ogg` |
| https://freesound.org/s/860717/ | artemditkovsky — Interior sound of a moving car | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `road-cabin-860717.mp3` | `road-cabin-loop.ogg` |
| https://freesound.org/s/128290/ | GaryQ — School Bus.mp3 | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `bus-rattle-128290.mp3` | `bus-rattle-loop.ogg` |
| https://freesound.org/s/585570/ | Athul_PR — Indian Street traffic Ambience 2.WAV | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `ambience-kerala-585570.mp3` | `ambience-kerala-loop.ogg` |
| https://freesound.org/s/515515/ | jdaudioproductions — Night traffic Kerala Road 1 .wav | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | `ambience-kerala-night-515515.mp3` | `ambience-kerala-night-loop.ogg` |

## Verified reference/candidate files not used in runtime

These are intentionally **not** loaded by `AudioEngine`; they remain under `raw/freesound/` for comparison/research.

| Source URL | License | Local file | Reason not in runtime |
|---|---|---|---|
| https://freesound.org/s/831721/ | CC0 1.0 | `diesel-pullaway-831721.mp3` | Excellent old diesel bus pullaway with multiple baked gear changes. Kept as calibration/reference because playing it under live telemetry would create gear changes that disagree with physics. |
| https://freesound.org/s/508540/ | CC0 1.0 | `horn-india-bus-508540.mp3` | Alternate India-recorded melodic bus horn candidate; player runtime currently uses the heavier `451697` horn. |
| https://freesound.org/s/386401/ | CC0 1.0 | `interior-rattle-386401.mp3` | Rejected after verification: it is a tool-case/tool rattle, not vehicle interior. |
| https://freesound.org/s/685074/ | CC0 1.0 | `road-asphalt-interior-685074.mp3` | Earlier road-bed candidate; not used after choosing documented source `860717`. |

## Source-quality caveats / R8 recording priorities

The system architecture is ready for authentic replacements, but these CC0 recordings remain **prototype engineering material**, consistent with `AUDIO_BIBLE.md`. Highest-priority local replacements are: actual Kerala heavy-bus idle/low/mid/high under load, several clean shift events, horn exterior/interior, air-brake apply/release, real bus door, real cabin/body/window/handrail rattle over rough Kerala roads, wipers and roof rain.

`road-cabin-loop.ogg` is currently a generic moving-vehicle interior recording and `rain-roof-loop.ogg` is rain on a car roof. They are appropriate prototype layers, not claims of authentic KSRTC recording. `bus-rattle-loop.ogg` is an empty school-bus recording with metallic/clanky equipment and is closer to the intended vehicle texture, but still not the final signature Kerala bus.

The Kerala day ambience source (`585570`) was recorded at Alichuvadu Junction, Vennala, Kerala and contains naturally occurring traffic/auto/horn/background Malayalam speech. It is ambience only; do not promote any background speech into hero dialogue. No copyrighted movie dialogue/audio is present.

## Repro / validation

```bash
cd /home/drvij/projects/adutha-stoppil/reboot/workstreams/audio-system
npm install
npm run process:audio
npm run build
npm run dev
```

Validation completed in this workstream:

- TypeScript production build passes.
- Vite production build passes.
- Exactly 20 runtime OGG files are copied into the built demo.
- All 20 runtime files re-probed at 48 kHz after correcting an intermediate `loudnorm` 192 kHz upsample issue.
- `runtime/SHA256SUMS.txt` verifies after processing.
- Development server returned HTTP 200 for demo, engine module, engine loop, shift transient and Kerala ambience test requests.
- `npm run verify:audio` passes: 20/20 runtime OGGs, SHA-256 integrity, byte-identical public mirror, 48 kHz, expected mono/stereo policy, nontrivial durations, and decoded peak headroom below -1 dBFS.
- `npm run lint` passes with 0 warnings / 0 errors.
- `npm test` passes 6 deterministic adapter/event tests covering the exact physics telemetry shape, reverse-speed handling, shiftSerial changes, boolean shift edge behavior, takeoff/decel/air-brake gating, and dry-only panic-brake squeal gating.
- Audio adapter was cross-checked against `/workstreams/physics-drivetrain/src/sim/config.ts` and `HandlingLab.tsx`; it now consumes `drivetrainLoad`, `shiftSerial`, `shifting` and `shiftProgress` directly. No physics files were modified.
- No live R1/R2 folders were changed. No Git/GitHub, OMP or Luna was used.

## Files to take forward

- `src/AudioEngine.ts` — engine/API
- `runtime/` — runtime audio payload
- `scripts/process_audio.sh` — reproducible processing pipeline
- `provenance/SOURCE_LEDGER_AUDIO.md` — human-readable provenance
- `provenance/sources.json` — machine-readable provenance
- `MIXER_AND_TELEMETRY.md` — physics/mixer contract
- `README.md` — local demo instructions
- `HANDOFF.md` — this document

For integration, copy/import the engine and runtime assets rather than the demo UI. Preserve `raw/` and provenance outside the shipping bundle.
