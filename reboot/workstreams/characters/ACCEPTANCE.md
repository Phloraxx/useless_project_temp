# Character / Animation Acceptance Matrix

Workstream: `/home/drvij/projects/adutha-stoppil/reboot/workstreams/characters`

| Requirement | Status | Evidence |
| --- | --- | --- |
| Reusable `AnimatedCharacter` | PASS | `src/components/AnimatedCharacter.tsx` |
| `SkeletonUtils.clone()` | PASS | skinned instances cloned per character |
| `AnimationMixer` | PASS | one mixer per cloned character root |
| Direct compatible clip reuse | PASS | UAL1/UAL2 65-joint names verified identical |
| Smooth crossfades | PASS | semantic state changes use 0.28 s crossfade |
| Character socket positioning | PASS | fallback layout + canonical GLB resolver |
| Examiner seated in socket | PASS | examiner review proof |
| Examiner idle → talk → idle | PASS | deterministic 13 s state cycle |
| Conductor rail/idle/talking | PASS | conductor review proof |
| Boarding/walk/sit passenger | PASS | 18 s deterministic entrance/aisle/seat cycle |
| Bus-motion additive reaction | PASS | filtered spine/head overlay after mixer update |
| Character LOD strategy | PASS | hero full-rate; passenger 60/30/12 Hz + far cull |
| Examiner placeholder appearance | PASS for rig proof | neutral shirt, dark trousers, clipboard; mesh explicitly non-final |
| Examiner/conductor/doorway/aisle cameras | PASS | `src/scene/ReviewCamera.tsx` |
| Screenshot proof | PASS | `screenshots/final/01` through `10` |
| Video proof | PASS | `captures/character-animation-proof.webm` |
| Isolated build | PASS | no live R1/R2 mutation |
| Lint/build | PASS | oxlint 0 warnings/0 errors; Vite production build passes |
| Short runtime stability | PASS | 120 s heap/resource observation, zero runtime errors |
| 15 min spawn/despawn leak test | PASS | 12↔4 passenger churn every 1.5 s; 0 runtime errors; flat fitted heap trend |

## Notes

The `?stress=1` query activates a hidden test population only. It repeatedly destroys and recreates passenger character instances so mixer/root cleanup is exercised without changing the normal review proof.

`src/scene/socketResolver.ts` resolves canonical socket names from a final bus hierarchy, accepts temporary current-R2 aliases, and falls back to the isolated proof transforms if a node is absent.

The 15-minute stress result is in `stress-leak-15m.json`: 16 forced-GC samples, 75.57–81.41 MB used heap, resource count fixed at 22, zero runtime errors, fitted slope -0.004 MB/min.

The remaining Vite bundle-size warning is an integration optimization, not a failed character-system requirement.
