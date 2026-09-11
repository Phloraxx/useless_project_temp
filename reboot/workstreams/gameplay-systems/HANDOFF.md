# Gameplay Systems Handoff

Date: 2026-09-12
Workstream: `/home/drvij/projects/adutha-stoppil/reboot/workstreams/gameplay-systems`

## Status

Gameplay-system foundation is implemented in isolation. No live R1/R2 files, world rendering, bus models or audio were touched.

## Public boundary

Import from `src/index.ts`.

### EncounterDirector

Inputs: run seed + authored `EncounterDefinition[]` + per-tick/per-chunk `EncounterContext`.

Outputs: `EncounterSelection | null` with source `scheduled` or `callback`.

Important behavior:
- global encounter spacing requires both minimum game-time and route-distance gaps;
- encounter-specific time/distance cooldowns;
- recent encounter and anti-repeat-group exclusion;
- active encounter incompatibilities;
- chunk tags and geometry tags;
- traffic density, weather and passenger-count gates;
- story required/excluded gates;
- rarity-weighted deterministic selection;
- outcome-driven follow-up queue with availability/expiry distance and callback tags;
- encounter and callback random streams are separated by PRNG domain.

### ExaminerScoring

Input: one `SemanticDrivingEvent` plus current `{ flow, approval }`.

Output: `ScoreDecision | null`. `null` means a non-safety score event was suppressed by its anti-spam cooldown.

A decision carries:
- stable `reasonCode` for dialogue/UI/analytics;
- classification (`qualification_success`, `qualification_mistake`, `safety_penalty`, `fatal_failure`, `neutral`);
- base and awarded score;
- Flow before/after;
- approval and strike deltas;
- grading-interruption request;
- safety-critical flag;
- optional fatal failure reason.

Positive events are multiplied by the **existing** Flow value, then Flow increments, avoiding self-multiplication on the same event. Negative penalties are not Flow-multiplied.

Safety override invariant: impacts/loss-of-control never return positive points. Non-fatal penalty events still obey anti-spam cooldowns; fatal run-ending events bypass cooldown suppression. This prevents noisy telemetry from draining score repeatedly while ensuring a run-ending event is never hidden by a recent score event.

### PlayerRunState

Owns run seed, monotonic distance, non-negative score, Flow clamp 1–8, Approval clamp 0–100, strikes, failures, encounter discovery/history, callback history and local best score.

Persistence is dependency-injected through `ScoreStore`. `MemoryScoreStore` is test-safe. `LocalScoreStore` accepts any browser-like `Storage` object; integration should pass `window.localStorage` rather than this module importing browser globals.

## Semantic events currently covered

`STOP_PRECISION`, `TOO_PERFECT_STOP`, `HARD_BRAKE`, `HORN_USE`, `REPEATED_HORN`, `LATE_PASSENGER_STOP`, `IMPOSSIBLE_ETA_RESPONSE`, `SHOULDER_EXCURSION`, `ROUGH_ROAD_SMOOTHNESS`, `COLLISION`, `PEDESTRIAN_COLLISION`, `EXCESSIVE_ROLLOVER_RISK`, `REVERSING`, `CONDUCTOR_CUE`, `TRAFFIC_COMMUNICATION`.

Thresholds are initial gameplay candidates, not final vehicle-physics truth. Physics integration should emit already-semantic events using its validated telemetry thresholds; `ExaminerScoring`'s hard-collision speed/impulse thresholds are configurable.

## Recommended integration order

1. Wire `VehicleSimulation` semantic event adapter into `ExaminerScoring`.
2. Wire route/chunk metadata into `EncounterContext`.
3. Have authored encounter state machines call `registerOutcome`.
4. Send `ScoreDecision.reasonCode` to examiner/conductor/passenger performance lookup.
5. Send `gradingInterruptionRequested` as a request to `CinematicDirector`; the cinematic system remains responsible for deciding when a safe shot can run.
6. Put `PlayerRunSnapshot` into the coarse Zustand/UI layer only as a projection; do not make React state the simulation source of truth.
7. Promote stable encounter JSON to the final authored content pipeline once the encounter schema is agreed across world/narrative workstreams.

## Regression coverage

The deterministic tests assert:
- encounter global spacing prevents spam;
- recent encounters do not immediately repeat;
- scoring cooldowns suppress score spam and Flow multiplication is stable;
- collision/pedestrian-impact paths never reward points;
- authored callbacks are queued and selected after their distance gate;
- equal seeds produce equal encounter sequences, different seeds diverge;
- parody grading mistakes and real safety failures remain separate classifications.

Run `npm test` after integration edits.

## Deliberate non-goals / future hooks

- No React/Zustand store here; keep this core framework-neutral.
- No world spawning/state-machine implementation beyond selection contracts.
- No passenger mood scoring yet; the design bible explicitly says passenger mood is not a second judge. It should consume event/reaction outcomes separately.
- No remote leaderboard/backend. Local score abstraction is sufficient for the current reboot truth.
- No grading cinematic execution; only a request flag.
- No generative/runtime dialogue.

## Content-tuning note

The numerical score/approval thresholds are intentionally centralized in `ExaminerScoring`. Once handling telemetry is validated, tune these values from recorded playtest distributions rather than making physics code contain comedy-specific thresholds.
