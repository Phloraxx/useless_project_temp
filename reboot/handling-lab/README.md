# അടുത്ത സ്റ്റോപ്പിൽ — R1 Handling Lab

This app is the disposable vehicle-feel laboratory for the V2 reboot. It is intentionally separate from the legacy game and contains no final world, dialogue, passenger or bus art.

## Public test build

`https://adutha-r1-144-24-114-90.sslip.io`

The old public prototype remains untouched.

## Controls

Desktop: `W` throttle, `S` brake then reverse after near-stop, `A/D` steer, `Space` emergency brake, `R` reset.

Mobile landscape: analog steering pad, `GO`, and `BRAKE / REV`.

Audio is opt-in because browsers block autoplay. `ENABLE LAB AUDIO` enables telemetry-driven placeholder engine, road and brake layers.

## Built-in feel candidates

- **Heavy** — slower power response, softer steering and more visual weight.
- **Balanced** — current reference baseline and best objective rough-road result.
- **Arcade** — faster response, stronger brakes and more direct camera/steering.

## Structured human comparison

Use the `R1 HUMAN TEST` panel instead of switching presets from memory.

Each run lasts 60 seconds. The lab shuffles Heavy, Balanced and Arcade, hides the mapping as Candidate A/B/C, and automatically resets between runs. Telemetry and tuning controls are hidden during the blind portion.

During each run, use the whole lab: accelerate, brake hard once, corner, touch the laterite shoulder and cross the rough section.

The harness records maximum speed, distance, body roll/pitch, longitudinal/lateral acceleration, minimum wheel contacts, time spent on wet/laterite/rough surfaces and steering correction count.

After every run, select feel tags and add a short note. The latest session is kept in browser local storage and the completed comparison can be exported as JSON.

## Reading an exported session

Run `npm run playtest:summary -- /path/to/session.json` to print the preset mapping, feel tags, driving metrics and frame-rate warning for each candidate.
