<img width="1280" height="640" alt="TinkerHub Useless Projects" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# അടുത്ത സ്റ്റോപ്പിൽ™ 🎯

## Basic Details
### Team Name: അടുത്ത സ്റ്റോപ്പിൽ

### Team Members
- Team Lead: Sourav P Bijoy — Sahrdaya College of Engineering & Technology

### Project Description
A Kerala bus-driving comedy game where a completely stone-faced examiner grades you using absurd fictional bus-qualification logic. The player drives one continuous, increasingly chaotic Kerala route while passengers, roadside events, weather, dialogue, cinematics, and the examiner react to how the bus is being driven.

### The Problem (that doesn't exist)
Kerala has plenty of driving tests, buses and unsolicited driving advice, but apparently no examination where doing something perfectly sensible can still be marked wrong because it was "not sufficiently bus-driver-like."

### The Solution (that nobody asked for)
Build an unnecessarily serious bus simulator around that imaginary qualification exam: heavy bus physics, gear shifts, passengers, authored Kerala road chunks, Malayalam dialogue, conductor bells, rain, traffic situations, cinematic examiner reactions and a scoring system that distinguishes genuine danger from ridiculous fictional examiner logic.

## Technical Details
### Technologies/Components Used
For Software:
- TypeScript / React
- Three.js + React Three Fiber
- Rapier 3D physics
- Vite
- Zustand
- Web Audio API
- Blender asset pipeline
- Authored chunk streaming, encounter/scoring and cinematic systems

### Implementation
The repository contains the integrated V3 work-in-progress plus the isolated workstreams used to build and validate each major subsystem.

#### Installation
```bash
cd reboot/game-v3
npm ci
```

#### Run
```bash
npm run dev
```

#### Production build
```bash
npm run build
```

Desktop controls: `W` throttle, `S` brake/reverse, `A/D` steering, `Space` emergency brake, `R` reset. Mobile touch steering uses the same physical left/right convention as keyboard input.

## Project Documentation

### Screenshots
![Kerala road chunk](reboot/workstreams/endless-world/screenshots/final/town-high-street.png)
*Authored Kerala-style town chunk from the endless-world streaming workstream.*

![Examiner cinematic](reboot/workstreams/cinematics-ui/proof/judgement-examiner.png)
*Examiner grading presentation from the reusable cinematic director proof.*

![Character animation](reboot/workstreams/characters/screenshots/final/02-examiner-talk.png)
*Seated examiner animation/state-graph proof inside the bus.*

### Architecture
The reboot was deliberately split into independently testable workstreams and then brought together through a shared integration contract:

`input → drivetrain/physics → world streaming → semantic driving events → encounter director → examiner scoring → cinematics/dialogue/audio → presentation`

See [`reboot/INTEGRATION_CONTRACT.md`](reboot/INTEGRATION_CONTRACT.md) and [`reboot/INTEGRATION_ORDER.md`](reboot/INTEGRATION_ORDER.md) for the exact contracts and integration sequence.

### Major Workstreams
- Physics + drivetrain — 13.2 t effective bus, 5.64 m wheelbase, 6-speed arcade drivetrain, fixed-step tests and corrected touch steering.
- Endless world — seeded streaming of authored Kerala road chunks with world-origin rebasing and logical route distance.
- Gameplay systems — encounters, player run state, Flow and examiner scoring.
- Characters — seated examiner/conductor/passenger animation states and vehicle-motion overlays.
- Cinematics/UI — camera-state director, safe/unsafe grading reactions and presentation UI.
- Audio — layered telemetry-driven engine, shifts, brakes, horn, rain, road and Kerala ambience.
- Dialogue/story — spoken-Malayalam draft dialogue, progression, callbacks and deadpan institutional comedy.

### Asset / License Note
CC0 assets and audio used by the public project are documented in [`reboot/SOURCE_LEDGER.md`](reboot/SOURCE_LEDGER.md) and workstream provenance files.

A newer bus mesh experimented with during development was derived from a user-downloaded OBJ whose redistribution rights could not be established. That source, its texture and derived "authentic" bus exports are intentionally **not included in this public repository**. The source code and authored blockout/prototype assets remain available without publishing that unresolved third-party material.

### Project Demo
The current repository is an active integration snapshot. Run `reboot/game-v3` locally using the commands above. The subsystem proofs and handoff documents are kept in `reboot/workstreams/` so the development trail is reproducible.

## Team Contributions
- Sourav P Bijoy: concept, direction, game design, implementation/integration, testing and production pipeline.

---
Made at TinkerHub Useless Projects

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
