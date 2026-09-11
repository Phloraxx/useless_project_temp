# Physics / Drivetrain Workstream Handoff

Status: **READY FOR INTEGRATION** — 2026-09-12

Workspace: `/home/drvij/projects/adutha-stoppil/reboot/workstreams/physics-drivetrain`

No live R1/R2 folder was modified. No Git/GitHub or OMP/Luna was used.

## Recommended tune

**Balanced** is the recommended default.

It preserves a clearly heavy full-size-bus character without becoming frustrating: strong low-gear pull, obvious torque interruption on shifts, readable brake dive/body motion, stable high-speed steering, recoverable rough-road behavior, and materially worse braking on wet/laterite surfaces.

Heavy is useful as the slower reference but does not reach 60 km/h in the acceleration benchmark. Maniac is the arcade edge: much faster and still controlled after retuning, but more abrupt and less appropriate as the default.

## Real-vehicle sanity reference

Ashok Leyland's current Viking specification was used only as a dimensional/power sanity bound: 5,639 mm wheelbase option, 147 kW, 700 Nm, 6-speed overdrive transmission, 10.934–11.422 m length, 2,600 mm width, and 16,200 kg maximum GVW.

Official reference: `https://www.ashokleyland.com/in/buses/brands/viking/specification`

The game does **not** simulate those engine/gear ratios literally. Effective mass, force, steering and grip are deliberately arcade-tuned.

## Objective Balanced benchmark

- 0–20 km/h: **3.10 s**
- 0–40 km/h: **8.17 s**
- 0–60 km/h: **18.78 s**
- 35 s peak speed: **61.50 km/h**
- 40–0 dry: **11.38 m / 1.88 s**
- 60–0 dry: **22.85 m / 2.63 s**
- 40–0 wet: **13.96 m** (**+22.7%** vs dry)
- 40–0 laterite: **15.62 m** (**+37.2%** vs dry)
- sustained turn: **0.57° max chassis roll**, **13.78°/s max yaw**, **4/4 wheel contact**
- slalom: **18.66°/s max yaw**, **34.30 km/h exit**, **4/4 wheel contact**
- rough road: **0.84 g peak vertical**, **0.89° pitch**, minimum **2/4 wheel contact** over the intentionally severe patch
- reverse peak: **12.14 km/h**
- fixed-step consistency at 30/60/120 render FPS: **0.000000 m / 0.000000 km/h / 0.000000° measured deltas**

Balanced full-throttle upshift starts occur at approximately **12.84, 24.71, 37.05, 49.54 and 59.32 km/h**. Requested shift cut is 320 ms; fixed-60-Hz measured cuts are **333.3 ms** because the shift state resolves on simulation ticks.

A 60–0 stop also produces the expected automatic downshift chain **6→5→4→3→2→1**. All measured shift interruptions stay inside the requested 250–400 ms window.

## Subjective expected feel

Balanced should feel tall and heavy but not inert. First and second gear pull decisively, each upshift briefly releases thrust and body pitch, and the bus settles rather than snapping back. Steering is generous at low speed but fades substantially by road speed. Braking is powerful enough for comedy-game recoverability while retaining visible stopping distance and dive.

Wet asphalt should be immediately noticeable without becoming ice. Laterite is deliberately looser than wet asphalt. Rough sections produce visible chassis activity and temporary wheel-contact loss but remain recoverable.

Maniac is intentionally more dramatic: 0–60 is about **13.40 s**, peak about **64.70 km/h**, and sustained-turn roll is about **2.98°** after the safety retune. Heavy takes about **9.62 s to 40 km/h** and peaks near **57.98 km/h**.

## Exact Balanced chassis / surface values

- effective mass: `13200 kg`
- wheelbase: `5.64 m`
- track width: `2.04 m`
- wheel radius: `0.48 m`
- chassis collider half extents: `[1.18, 0.56, 5.28] m`
- COM Y offset: `-0.24 m` using Rapier mass properties; collider is not physically lowered
- linear damping: `0.075`
- base angular damping: `1.22`
- fixed timestep: `1/60 s`; max catch-up substeps: `5`
- grip multipliers: asphalt `1.00`, wet `0.64`, laterite `0.48`, rough `0.88`
## Exact Balanced power / steering / suspension values

- rear-axle base engine force: `11800`
- full brake impulse: `340`
- power-taper target speed: `67 km/h`
- reverse limiter target: `13 km/h`
- throttle rise/fall: `1.85 /s`, `3.5 /s`
- brake rise/fall: `4.9 /s`, `6.5 /s`
- low-speed steering: `31°`
- high-speed steering: `8.5°`
- steering fade: `18 → 62 km/h`
- steering response: `2.75 rad/s`
- suspension rest length: `0.39 m`
- suspension stiffness: `32`
- compression / rebound damping: `4.8 / 5.8`
- max suspension travel: `0.27 m`
- max suspension force: `82000`
- tyre friction slip: `3.25`
- side-friction stiffness: `1.28`
- high-speed yaw-damping gain: `0.34`
- visual body-roll gain: `0.020`
- visual body-pitch gain: `0.014`
- visual body-motion response: `4.9 /s`

## Drivetrain state contract

Six forward bands use speed-to-normalized-RPM bands rather than a clutch/shaft simulator.

- gear minimum km/h bands: `[0, 9.5, 19, 29.5, 40, 50]`
- gear maximum km/h bands: `[15, 27, 39.5, 52, 62, 72]`
- torque multipliers 1→6: `[1.48, 1.27, 1.10, 0.99, 0.95, 0.89]`
- upshift normalized-RPM thresholds 1→5: `[0.88, 0.89, 0.90, 0.91, 0.90]`
- normalized idle RPM: `0.18`
- Balanced requested shift interruption: `320 ms`
During a shift, rear-axle engine force is zero. There is no clutch simulation. The drivetrain exposes `gear`, `normalizedRpm`, `load`, `shifting`, `shiftProgress`, and `shiftSerial` in telemetry.

At shift start the runtime emits browser event **`adutha:drivetrain-shift`** with `{ serial, fromGear, toGear, reason }` in `CustomEvent.detail`. This is the audio hook; final audio was intentionally not implemented here.

## Touch steering verification

Input semantics are explicit in `src/sim/input.ts`: `STEER_LEFT = -1`, `STEER_RIGHT = +1`. Keyboard `A/ArrowLeft` and `D/ArrowRight`, virtual buttons, and analog touch steering use that same convention.

The touch pad is visually labelled `← LEFT` and `RIGHT →`. The deterministic physical test at the same forward speed produced:

- left input `-0.45`: lateral displacement **-4.8816 m**, yaw **-31.605°**
- right input `+0.45`: lateral displacement **+4.8816 m**, yaw **+31.605°**

Result: touch steering is physically correct and keyboard convention remains intuitive.

## Exact source changes vs baseline handling-lab

- `package.json`
- `scripts/benchmark.mjs`
- `scripts/run-candidates.mjs` (new)
- `scripts/verify-benchmarks.mjs` (new)
- `src/App.css`
- `src/App.tsx`
- `src/HandlingLab.tsx`
- `src/sim/config.ts`
- `src/sim/drivetrain.ts` (new)
- `src/sim/input.ts`
- `src/ui/PlaytestPanel.tsx`

Generated output also includes rebuilt `dist/` and final benchmark artifacts under `benchmarks/`.

## Benchmark artifacts

- `benchmarks/balanced-drivetrain-final.json`
- `benchmarks/heavy-drivetrain-final.json`
- `benchmarks/maniac-drivetrain-final.json`
- `benchmarks/FINAL_BENCHMARK.txt`
- `benchmarks/final-presets/balanced.json`
- `benchmarks/final-presets/heavy.json`
- `benchmarks/final-presets/maniac.json`
## Integration instructions

1. Treat `src/sim/drivetrain.ts` as the drivetrain source of truth. Step it once per fixed physics tick before applying rear-wheel engine force.
2. Merge the `BusTuning`, `BUS`, `SURFACE_GRIP`, and telemetry additions from `src/sim/config.ts`.
3. Preserve the **5.64 m** wheelbase and the separate low COM mass properties. Do not lower the actual collision box to fake COM.
4. Apply drivetrain `torqueMultiplier` to rear-wheel engine force. During `shifting`, torque multiplier is zero.
5. Preserve `adutha:drivetrain-shift` for the audio workstream and the telemetry gear/RPM/load fields for UI/audio/animation.
6. Preserve the shared steering sign convention from `src/sim/input.ts`; do not invert touch independently from keyboard.
7. Keep physics at fixed 60 Hz. Rendering may run at another cadence, but controls/drivetrain/Rapier stepping must remain fixed-step.
8. When the hero bus is mounted, keep render geometry as a visual child. Do not generate physics collision from the hero mesh.
9. The main `R2_BUS_ASSET_SPEC.md` still contains the older 5.45 m contract because this workstream was forbidden from modifying live/main folders. Integration must update that contract to approximately **5.64 m**.
10. Start integration with **Balanced**. Keep Heavy and Maniac only as comparison/debug presets until human playtesting requests otherwise.

## Known risks / follow-up

- Deterministic tests verify steering sign and physics behavior, but an actual phone/tablet two-thumb playtest is still required before declaring final touch feel frozen.
- The mass/inertia model is a box approximation with a deliberately low effective COM. Hero-bus geometry or passenger loading should not silently replace these mass properties.
- `engineForce` is a Rapier/gameplay parameter; it is not a direct conversion of the Viking's 147 kW / 700 Nm specification.
- Heavy deliberately does not reach the 60 km/h benchmark; this is expected for that comparison preset, not the recommended default.
- Maniac is stable after retuning, but its sustained-turn roll and rough-road vertical response are intentionally more aggressive than Balanced.
- Rough-road fixtures are severe greybox test inputs. Final-world road roughness should be authored against the resulting telemetry, not copied literally.
- Production build reports a Vite large-chunk warning (~3.98 MB main JS before gzip). This is a bundle/code-splitting concern, not a physics failure.
- Final blind human feel testing can still justify small changes, but change one responsibility group at a time and rerun `benchmark:all` + `benchmark:verify` afterward.

## Commands and final results

From the workstream root:

```bash
npm ci
npm run build
npm run lint
npm run benchmark:all
npm run benchmark:verify
```

Final validation on 2026-09-12:

- `npm run build` — **PASS**; Vite production build completed, with only the large-chunk warning noted above.
- `npm run lint` — **PASS: 0 warnings, 0 errors**.
- `npm run benchmark:all` — **PASS**; regenerated Heavy, Balanced and Maniac JSON reports.
- `npm run benchmark:verify` — **PASS**; Balanced physics gates, shift timing, touch steering, surface differentiation, reverse limit and fixed-step consistency all passed.

## Recommendation

Integrate **Balanced** unchanged first. It is the best current expression of the target: a bus that reads as heavy and mechanically dramatic but is still enjoyable to throw around.
