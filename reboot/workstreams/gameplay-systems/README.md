# അടുത്ത സ്റ്റോപ്പിൽ™ — Gameplay Systems Workstream

Isolated TypeScript gameplay layer for the reboot's endless qualification run. This workspace does **not** render the world, own vehicle physics, play audio, or modify live R1/R2.

## What is implemented

- `EncounterDirector` — seeded authored encounter selection with eligibility, cooldowns, rarity weights, anti-repetition, active incompatibilities, chunk/geometry requirements, traffic/weather/passenger/story gates, and deterministic follow-up callbacks.
- `ExaminerScoring` — converts semantic driving events into score/Flow/Approval/strike/failure decisions while keeping parody qualification rules separate from real safety failures.
- `PlayerRunState` — distance, score, Flow x1–x8, approval, strikes/failures, discovered encounter history, callbacks, run seed and local-best persistence abstraction.
- semantic event contracts covering stop placement, braking, horns, passenger stops/ETA, shoulder excursions, rough road, collision, pedestrian impact, rollover risk, reversing, conductor cues and traffic communication.
- deterministic simulation harness and zero-framework unit-style regression tests.
- sample authored encounter data in both TypeScript and JSON.

## Install and run

```bash
npm install
npm test
npm run simulate
npm run simulate -- my-seed
```

`npm test` compiles with strict TypeScript first, then runs deterministic assertions. `npm run simulate` feeds mocked route context and semantic events through the same public APIs intended for integration.

## Integration shape

Physics/world systems should emit semantic events, not examiner comedy. Example:

```ts
const event: SemanticDrivingEvent = {
  type: 'HARD_BRAKE',
  simTimeMs: clocks.gameMs,
  distanceM: route.distanceM,
  payload: { decelMps2: 5.2, speedKph: 36 },
};
const decision = scoring.score(event, run.snapshot());
if (decision) run.applyScoreDecision(decision);
```

A UI/dialogue/cinematic integration can react to `ScoreDecision.reasonCode`, `classification`, and `gradingInterruptionRequested`. It should not infer grading directly from raw vehicle telemetry.

World streaming builds an `EncounterContext` from the currently available authored chunk and asks:

```ts
const selection = encounterDirector.select(context);
```

When an encounter state machine resolves:

```ts
run.recordEncounter(selection.definition.id, outcome);
encounterDirector.registerOutcome(selection.definition.id, outcome, { distanceM: context.distanceM });
```

A future event bus can wrap these calls; none of these modules import React, Three, Rapier, Zustand, dialogue, audio or rendering code.

## Determinism

Encounter choice and callback probability use separate seeded PRNG domains. Cosmetic random calls elsewhere therefore do not perturb encounter ordering. Given the same encounter data, seed and context sequence, selection is reproducible.

## Safety invariant

`COLLISION`, `PEDESTRIAN_COLLISION` and excessive loss-of-control states enter safety/fatal scoring paths. Collision scoring clamps points/approval non-positive and resets Flow. A hard collision or pedestrian impact can end the run. No parody rule can override those paths.

## Encounter fairness

This layer evaluates whether an encounter is eligible; telegraphing and the authored state machine still belong to encounter/world integration. Data contains the environmental prerequisites so a situation is not scheduled where its safe/readable setup cannot exist.

## Files

- `src/events.ts` — semantic driving event contract
- `src/encounters.ts` — encounter schemas/context
- `src/random.ts` — deterministic domain PRNG
- `src/EncounterDirector.ts` — encounter scheduling
- `src/ExaminerScoring.ts` — grading/scoring
- `src/PlayerRunState.ts` — mutable run state + score storage adapters
- `src/data/sampleEncounters.ts` — integration-ready sample definitions
- `data/sample-encounters.json` — external authored-data sample
- `tests/run-tests.ts` — deterministic regressions
- `harness/simulate.ts` — fake route/telemetry driver
- `HANDOFF.md` — integration handoff
