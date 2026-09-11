# Reboot Technical Architecture

## Runtime stack

Keep browser-first delivery: Vite + React + TypeScript, React Three Fiber/Three.js, Zustand for coarse game state, Rapier for rigid-body/vehicle physics, Web Audio/Three positional audio, local persistence for settings/high scores.

The reboot code should be a new app/module tree beside the legacy implementation until the vertical slice wins.

## Core systems

- `VehicleSimulation` — chassis, wheels, assists, surfaces, telemetry.
- `VehiclePresentation` — bus mesh, wheel/suspension transforms, lights, wipers, door.
- `CameraDirector` — chase + cinematic shots.
- `WorldStreamer` — chunk lifecycle, origin shift, pools.
- `TrafficSystem` — lanes, background agents, encounter agents.
- `CharacterSystem` — manifests, movement, animation mixers, body reactions.
- `EncounterDirector` — scheduling and authored state machines.
- `ExaminerSystem` — grading rules, approval and performance reactions.
- `DialogueDirector` — barks, subtitles, voice queues, priority/interrupt rules.
- `AudioDirector` — buses, engine model, ambience zones, spatial emitters.
- `ScoreSystem` — score, Flow, approval, run summary.
- `CinematicDirector` — safe-state requests, time scale, shot sequencing.
- `SaveSystem` — settings, local highscores, best seed/run stats.
## Event model

Systems communicate through semantic events rather than importing each other's UI/comedy logic.

Examples:
`VEHICLE_HARD_BRAKE`
`VEHICLE_SURFACE_CHANGED`
`STOP_ENTERED`
`STOPPED_AT_OFFSET`
`HORN_BURST`
`PASSENGER_REQUESTED_STOP`
`PASSENGER_BOARDED`
`EXAMINER_GRADE_REQUESTED`
`FLOW_CHANGED`
`MAJOR_COLLISION`

Event payloads carry telemetry snapshots and entity IDs. Encounter state machines subscribe to events and emit scoring/dialogue/cinematic intents.

## Simulation clocks

Separate concepts:
- render delta;
- fixed physics timestep;
- game/cinematic time scale;
- audio clock;
- encounter timers.

Do not bind scoring windows to frame count. Slow-motion cinematics must not corrupt physics thresholds or dialogue scheduling.
## Asset/loading strategy

Boot only the depot/handling essentials. Preload likely next chunk families and encounter assets one or two chunks ahead. Character/animation libraries should be cached and reused; do not duplicate skeleton/clip data per NPC.

Use GLB/glTF as runtime 3D format. Evaluate Meshopt/Draco only after measuring transfer/decoder cost. Texture compression/atlasing becomes a later optimization after the art pipeline stabilizes.

Use Three.js PMREM for the 1K HDR environments so PBR roughness receives stable image-based lighting without shipping high-resolution HDRIs.

## Quality tiers

`HIGH`: normal shadow distance/resolution, full nearby characters, rain density, higher DPR cap.

`MEDIUM`: lower shadow map/DPR, reduced background NPC update rate/vegetation density.

`LOW/MOBILE`: selective/no dynamic shadows on minor props, reduced particles/NPC count, lower DPR, simplified reflections and audio emitter count.

Gameplay/encounter logic must remain identical across tiers.
## Debug tooling required from day one

- handling parameter panel + presets;
- telemetry graph/export;
- chunk visualizer and forced-family selector;
- encounter force/skip/replay controls;
- passenger manifest/seat debug view;
- animation clip inspector;
- audio bus meters/mute/solo;
- cinematic safe-state/shot tester;
- seeded-run selector;
- performance HUD for FPS, draw calls, triangles, textures and active audio/characters.

## Determinism

Runs may be seeded. World chunk choice, encounter choice and non-critical NPC variants use deterministic PRNG streams separated by domain so changing a cosmetic random call does not reorder the whole run.

The showcase seed is stored as data and regression-tested.

## Replacement rule

Do not mutate the legacy production app into V2 incrementally. Build the reboot beside it. The live route changes only when R4's vertical slice clearly exceeds the prototype in handling, world, character presence and comedy delivery.