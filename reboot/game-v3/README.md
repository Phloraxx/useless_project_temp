# അടുത്ത സ്റ്റോപ്പിൽ™ — KSRTC Driver Qualification Test

TinkerHub Useless Projects build by Sourav P Bijoy and Aradhana Rose, Sahrdaya College of Engineering & Technology.

This is a fictional Kerala bus-driving qualification test where normal textbook driving is suspicious. The examiner rewards exaggerated “KSRTC instinct” through deliberately useless metrics while the physics simulation still decides whether the bus remains under control.

## Run

```bash
npm ci
npm run dev
```

Production validation:

```bash
npm run lint
npm run build
```

## Controls

- `W` / Up — throttle
- `S` / Down — service brake, then reverse near standstill
- `A/D` / Left/Right — steer
- `Space` — full brake
- `H` — Horn Diplomacy
- `R` — reset the bus and qualification run

## Useless qualification rules

The default UI is the fake **KSRTC Qualification Board**. It tracks:

- Passenger Fitness
- Schedule Recovery
- Road Ownership
- Horn Diplomacy
- Managed Recklessness
- Examiner Approval
- Textbook Contamination

A controlled stop a few metres away from the exact marker can earn Passenger Fitness because the passengers receive “free walking.” A suspiciously perfect stop loses fictional qualification points. Dry-road pace and clean aggressive-looking control can build Managed Recklessness; wet-road repetition loses marks.

This is parody game logic, not real driving advice or a factual claim about all KSRTC drivers.

## Engineering / handling mode

Open the app with `?lab=1` to restore the telemetry, tuning and blind handling-comparison panels used during development.

## Dialogue

Malayalam gameplay lines are original, conversational drafts intended for native-actor review. Optional movie-clip slots exist in the dialogue data, but copyrighted movie audio/dialogue is not bundled; any such clip should only be added if the team has permission to use it.

## Research

The exaggerated stereotypes behind the scoring are documented in `../research/PARODY_RESEARCH_REDDIT.md`, with Reddit source links and explicit notes that the material is anecdotal satire rather than evidence about every real driver.
