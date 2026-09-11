# അടുത്ത സ്റ്റോപ്പിൽ™ — Audio System Workstream

Isolated audio prototype for the reboot. It does not modify R1/R2.

## Run

```bash
npm install
npm run process:audio
npm run dev
```

The demo exposes RPM, load, speed, braking, gear, roughness, rain, wipers and interior perspective. For the intended drivetrain test: raise RPM/load, press SHIFT, then lower RPM. The audible sequence should be load rise, torque cut, shift transient, and lower-rev return.

## Main files

- `src/AudioEngine.ts` — reusable Web Audio engine/API.
- `runtime/` — canonical processed runtime OGG assets.
- `public/audio/` — demo mirror of runtime assets.
- `scripts/process_audio.sh` — reproducible ffmpeg pipeline.
- `provenance/SOURCE_LEDGER_AUDIO.md` and `provenance/sources.json` — source/license provenance.
- `MIXER_AND_TELEMETRY.md` — integration contract and default mix.
- `HANDOFF.md` — integration handoff.

Raw Freesound HQ previews are preserved under `raw/freesound/`; existing reboot prototype sources were copied unchanged under `raw/existing/` for reference. No copyrighted movie audio is included.
