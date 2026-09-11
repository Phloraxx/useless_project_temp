# Cinematics + Presentation Workstream Handoff

Status: READY FOR INTEGRATION — 2026-09-12

Workspace: `/home/drvij/projects/adutha-stoppil/reboot/workstreams/cinematics-ui`

## Implemented
- Reusable `CinematicDirector` with queued shot requests, smooth blend-in/hold/blend-out and exact chase-camera return.
- 15 requested camera states including chase, stop evidence, bus exterior, wheel, examiner, passenger, conductor, boarding, mirror, road/monsoon reveal and run-end wide.
- Safe-state gate before gameplay can be paused or input authority removed.
- Unsafe grading fallback uses examiner micro-animation/subtitle without taking camera control.
- Camera collision resolver hook, skip support and fast-forward support.
- Judgement helper that can chain evidence shot → examiner clipboard shot → chase.
- Micro-animation hooks for examiner, conductor, passenger/door presentation beats.
- Minimal depot/exam-office menu and restrained gameplay HUD prototype.
- Bundled Malayalam font; no Google Fonts runtime dependency.

## Primary API
Use `src/cinematics/CinematicDirector.ts`, `cameraStates.ts` and `types.ts`.
`request()` accepts a `CinematicRequest` plus current `SafetyState`.
`tick()` returns the selected camera pose, `gameplayTimeScale`, `inputAuthority`, subtitle beat and current phase.
