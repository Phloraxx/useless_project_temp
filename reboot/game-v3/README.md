# അടുത്ത സ്റ്റോപ്പിൽ™ — KSRTC Driver Qualification Test

## Live build
https://adutha-stoppil-144-24-114-90.sslip.io/

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


## Current useless qualification route

The default build is now a finite ~900 m TinkerHub showcase route with a complete application → exam → certificate loop. The player starts at the fictional application desk, enters a name, completes eight absurd qualification beats and finishes at a depot where the examiner generates a personalised result.

1. **Bus-stop cardio test (~102 m)** — exact textbook placement loses marks; controlled offset increases Passenger Fitness.
2. **Auto negotiation (~218 m)** — pass a physical auto obstruction without turning the road into a committee meeting.
3. **Decorative line recognition (232–282 m)** — use the chicane confidently while keeping the bus under control.
4. **Suspension trust exercise (~300 m)** — a speed breaker tests whether you trust the suspension more than the textbook.
5. **Passenger core workout (425–476 m)** — rough road rewards schedule-preserving momentum if physics agrees.
6. **Queue Allergy (525–596 m)** — two physical obstructions leave a usable gap; commitment is graded.
7. **Late Bell Recovery (~625 m)** — a second stop tests practical placement after a late request.
8. **Timetable Diplomacy (675–825 m)** — final dry-road sprint with a rival service; horn timing can improve the fictional grade.

Real contact with the scored obstacles is now reported by Rapier collision events. A meaningful collision ends the qualification immediately; reckless-looking near-miss driving can still earn parody points. The depot result records Natural Aptitude, Approval, Passenger Fitness, Schedule Recovery, Road Ownership and Textbook Contamination.

## Judge route

See `../JUDGE_DEMO.md` for the short showcase sequence. `?lab=1` still opens the engineering/tuning view.
