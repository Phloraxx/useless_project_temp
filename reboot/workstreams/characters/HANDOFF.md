# Character / Animation Workstream Handoff

## Status

This isolated workstream proves the character/animation foundation for the reboot of **അടുത്ത സ്റ്റോപ്പിൽ™**.

Path:
`/home/drvij/projects/adutha-stoppil/reboot/workstreams/characters`

Live R1/R2 were not modified. No Git/GitHub workflow was used.

The proof currently demonstrates:
- one compatible 65-joint humanoid foundation;
- direct Quaternius UAL1 + UAL2 clip reuse without retargeting;
- reusable `AnimatedCharacter` instances cloned with `SkeletonUtils.clone()`;
- per-character `AnimationMixer` playback and semantic state selection;
- smooth animation crossfades;
- seated examiner, standing conductor, and boarding passenger roles;
- bus-local character sockets and four review cameras;
- filtered vehicle-motion reactions layered after base clip evaluation;
- prototype wardrobe/material differentiation without changing the rig;
- adaptive animation update rate for non-hero passengers.

The supplied superhero meshes remain **rig proof only**. They are not final Kerala character art.
## Important verified rig fact

The following three sources were inspected directly:
- `Superhero_Male_FullBody.gltf`
- `UAL1_Standard.glb`
- `UAL2_Standard.glb`

All expose the same **65 joint names**. This is why the first proof intentionally uses animation clips directly on the cloned character skeleton instead of introducing a retargeting system.

UAL1 supplies the primary idle/walk/seated clips. UAL2 supplies rail, fold-arms, carry, nod and related secondary vocabulary.

## Runtime rendering bug fixed

The first proof capture showed the clipboard and bus mock but no character mesh. The failure was in the prototype material override, not the rig or animation data.

A single-material `SkinnedMesh` had accidentally been converted into a material array. With no matching geometry groups, Three.js produced no visible character surface. The override now preserves the original single-vs-array material cardinality.

This was validated in Chromium after the fix; the full skinned characters now render and animate.

## Main implementation files

- `src/components/AnimatedCharacter.tsx` — clone, mixer, clip selection, crossfade, additive motion, prototype outfit, LOD.
- `src/components/BoardingPassenger.tsx` — deterministic door → aisle → seat prototype.
- `src/animation/characterGraph.ts` — semantic animation state to authored clip map.
- `src/animation/stateMachines.ts` — deterministic examiner/conductor/passenger state timelines.
- `src/animation/MotionContext.tsx` — demo/manual chassis motion signal provider.
- `src/animation/motionSignalStore.ts` + `useMotionSignals.ts` — shared motion signal channel.
- `src/scene/socketLayout.ts` — contract-aligned bus-local character socket fallbacks and current-R2 aliases.
- `src/scene/socketResolver.ts` — resolves canonical sockets from the final bus GLB hierarchy with alias/fallback support.
- `src/scene/ReviewCamera.tsx` — examiner, conductor, doorway and aisle review shots.
- `src/scene/BusInteriorMock.tsx` — deliberately simple interior used only to inspect character behavior.
- `src/scene/LivingBusStage.tsx` — role composition and review stage.
- `scripts/capture-proof.mjs` — deterministic screenshot/video capture.
- `scripts/perf-observe.mjs` — sustained headless runtime/heap observation.

## Semantic animation state graph

Gameplay should request semantic states, not clip filenames.

Current mapping:
- `idle` → `Idle_Loop`
- `talking` → `Idle_Talking_Loop`
- `foldArms` → `Idle_FoldArms_Loop`
- `railIdle` → `Idle_Rail_Loop`
- `railCall` → `Idle_Rail_Call`
- `walk` → `Walk_Loop`
- `walkCarry` → `Walk_Carry_Loop`
- `sitEnter` → `Sitting_Enter`
- `sitIdle` → `Sitting_Idle_Loop`
- `sitTalk` → `Sitting_Talking_Loop`
- `sitExit` → `Sitting_Exit`

Default crossfade is `0.28 s`. Seat enter/exit use `LoopOnce` with `clampWhenFinished`; persistent states loop.
## Current role state machines

The proof uses deterministic timelines so review captures are repeatable.

**Examiner**: seated idle by default; `sitTalk` from 4–7 seconds of each 13-second cycle, then back to idle.

**Conductor**: rail idle by default; talking from 5–8 seconds; `railCall` from 10–12 seconds of each 13-second cycle.

**Passenger**: 18-second prototype cycle: wait → walk to door → walk through aisle → seat-enter → seated idle → seated talk → idle.

These timers are demonstration drivers, not the intended gameplay API. Integration should replace them with EncounterDirector/dialogue/boarding events while keeping the semantic character states.

## Socket contract

Prototype transforms are bus-local and follow the reboot coordinate contract: `+Z` forward, `+Y` up, `+X` right.

Implemented canonical sockets include:
- `SOCKET_DRIVER`
- `SOCKET_EXAMINER`
- `SOCKET_CONDUCTOR_HOME`
- `SOCKET_DOOR_ENTRY`
- aisle and seat prototype sockets

`socketLayout.ts` also records aliases for the currently available R2 detail asset, including the temporary `SOCKET_EXAMINER_HEAD` naming. When the final bus GLB lands, prefer actual canonical node transforms from the bus hierarchy and retain these values only as fallback/debug data.

Review camera modes are `examiner`, `conductor`, `doorway`, and `aisle`, corresponding to the cinematics bible's interior examiner/conductor/door boarding/aisle review needs.
## Bus-motion additive reaction

Base animation is evaluated first with `AnimationMixer.update()`. The motion layer then makes small local rotations on `spine_03` and `Head`, so the authored pose remains readable.

Inputs:
- longitudinal acceleration → brake/acceleration lean;
- lateral acceleration → corner sway;
- vertical impulse → speed-breaker head lag/compression cue.

Signals are exponentially filtered. Torso pitch/roll are clamped to roughly 0.12/0.11 radians and head correction is smaller. Role gain deliberately restrains the examiner (`0.46`) relative to conductor (`0.82`) and ordinary passenger (`1.0`).

The intended production input is filtered chassis telemetry from vehicle physics. `MotionProvider` currently synthesizes a demo signal and exposes manual sliders for inspection.

## Placeholder appearance

The original superhero mesh is deliberately retained to prove skeleton compatibility. A vertex-color override makes roles easier to read without changing topology or bones:
- examiner: light/neutral shirt region + dark trouser region + separate clipboard prop;
- conductor: khaki-like treatment;
- passenger: muted blue-grey clothing treatment.

This is not a substitute for final Kerala body/clothing/hair/accessory art. Replace the skinned mesh while preserving the compatible skeleton and semantic animation API.

## LOD / performance policy implemented

Tier A hero roles (examiner/conductor) remain full-rate. Adaptive passengers use approximate mixer update bands of **60 Hz under 10 m, 30 Hz from 10–20 m, 12 Hz beyond 20 m, and cull beyond 45 m**.
For production, keep this distance/update policy but add character pooling, shared clothing atlases/materials, and a cheaper Tier C rig or baked crowd representation. Do not create one mixer/material clone forever for every background pedestrian in the endless world.

## Build and lint validation

From the workstream root:

```bash
npm install
npm run lint
npm run build
npm run preview
```

Latest validation result:
- TypeScript/Vite production build: PASS
- oxlint: **0 warnings, 0 errors**
- Vite output JS: approximately **1.145 MB / 314 KB gzip**
- browser runtime capture: no page/console errors during the deterministic proof capture

The remaining Vite warning is bundle size (>500 KB). Three.js and the prototype app currently ship in one large client chunk. This is not a character-runtime correctness problem, but integration should code-split/lazy-load lab-only UI and avoid shipping unused proof tooling.

## Evidence captures

Deterministic final screenshots live under `screenshots/final/`:
- `01-examiner-idle.png`
- `02-examiner-talk.png`
- `03-conductor-talk.png`
- `04-doorway-boarding.png`
- `05-aisle-seated.png`
- `06-motion-neutral.png`
- `07-motion-brake.png`
- `08-motion-accel.png`
- `09-motion-corner.png`
- `10-motion-bump.png`
A continuous proof video is at:
`captures/character-animation-proof.webm`

Current capture metadata: WebM/VP8, 1280×720, 25 fps. It cycles through the animated character proof and camera modes; the capture script reported **0 runtime errors**.

## Sustained runtime observation

`performance-observation.json` records a 120-second Chromium headless run after initial asset load. This is a runtime-stability/heap observation, **not a representative GPU benchmark**.

Observed precise JS heap:
- 0 s: 59.2 MB used
- 30 s: 51.7 MB used
- 60 s: 51.8 MB used
- 90 s: 51.7 MB used
- 120 s: 51.9 MB used

Resource count remained constant at 22 and runtime error count remained zero. After startup allocation/collection, heap stayed roughly flat across multiple complete examiner, conductor and passenger cycles. No obvious short-run mixer/object leak appeared in this test.

A separate stress-only `?stress=1` harness now exercises repeated destruction/recreation of passenger characters: 12 ↔ 4 instances every 1.5 seconds for 15 minutes. `stress-leak-15m.json` contains 16 forced-GC samples. Used heap ranged 75.57–81.41 MB, resource count remained 22, runtime errors were zero, and the fitted heap slope was -0.004 MB/min (effectively flat). This passes the isolated mixer/object churn leak check. Production pooling should still be profiled again once final meshes and crowd systems are integrated.

## Known limitations

- Hero meshes are visually unsuitable for final game art; wardrobe coloration is deliberately only a rig-preserving placeholder.
- Boarding movement uses simple point interpolation rather than the final stop queue + aisle spline + seat reservation system.
- Seat fit/contact, hand-to-rail IK, foot placement and bus-step contact are not solved yet.
- The additive bus-motion layer is bone-rotation based; later bespoke brace/reaction clips can take over at authored hard-event thresholds.
- No facial blendshape/lip-sync system is part of this proof.
- No final driver character is implemented here.
- Camera shots are review framing only; the CinematicDirector workstream should own production blending/collision/safety policy.
- Headless Chromium memory results should not be interpreted as desktop/mobile frame-rate certification.

## Integration instructions

1. Copy/import `AnimatedCharacter`, animation graph/state types, and motion signal channel into the integration branch/worktree rather than rebuilding the logic inside gameplay code.
2. Replace demonstration timers with character-state requests from dialogue, EncounterDirector, boarding and grading events.
3. Mount characters under the actual R2 bus socket nodes. Prefer canonical names from `R2_NODE_CONTRACT.json`; remove temporary aliases once the final bus export is authoritative.
4. Feed vehicle-local filtered longitudinal/lateral acceleration and vertical impulse into `MotionSignalContext`.
5. Preserve the examiner's reduced motion gain; restraint is part of the character direction.
6. Replace superhero meshes with final compatible hero/passenger meshes while retaining the 65-joint naming contract wherever practical.
7. Keep Tier A full-rate. Apply adaptive sampling/pooling to Tier B/C characters and profile on target hardware with the real bus/world present.
8. Let CinematicDirector select examiner/conductor/doorway/aisle shots; do not put camera ownership into character components.
9. Add seat/standing reservations and aisle-spline navigation before increasing simultaneous boarding counts.
10. Before R5 sign-off, run the required 15-minute spawn/despawn/mixer leak test with production pooling enabled.

## Acceptance of this proof

For the requested **first living-bus-interior rig proof**, the core animation architecture, role behaviors, sockets, motion overlay, LOD strategy, visual evidence, lint and production build are complete. Remaining items above belong to integration/final-art/pooling acceptance rather than the initial skeleton/animation feasibility proof.
