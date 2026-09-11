# Master Reboot Plan

The reboot is not a polish pass. Build a new vertical slice beside the legacy game and replace the live prototype only when the new slice is clearly better.

## R0 — Research + preservation

Status: substantially complete.

- Preserve the legacy implementation and deployment.
- Establish `reboot/` as the new production-planning workspace.
- Research vehicle physics, open-world/chunk streaming, animation, audio, dialogue and cinematics.
- Download legally usable source packs and preserve provenance/hashes.
- Lock the new product truth and technical boundaries.

Pass condition: reboot has coherent design documents, asset provenance and no destructive changes to the current live game.

## R1 — Handling Lab

Build a separate greybox 400–600 m route with **new Rapier raycast-wheel physics**.

Deliverables:
- dynamic chassis and four raycast wheels;
- suspension + visual wheel travel;
- speed-sensitive steering and input smoothing;
- anti-roll/yaw assists;
- asphalt/wet/dirt surface response;
- braking pitch and body roll;
- spring chase camera with collision probe;
- keyboard/touch abstraction;
- live handling/debug panel and telemetry graphs.
R1 passes only when driving for 3–5 minutes is enjoyable with no dialogue and unfinished art.

## R2 — Hero Bus + Interior

Create the final fictional bus exterior and a partial playable/cinematic interior: door, wipers, lights, wheel steering, seats, rails, examiner seat and conductor zone. Drive body motion from physics.

## R3 — Living Kerala Slice

Build one 100–200 m authored road chunk to near-final quality: road/drain/shoulder, stop, shop, houses, signage, vegetation, traffic, ambient audio and 6–10 animated people with boarding.

## R4 — Examiner + Cinematic Grading

Add the physical examiner, clipboard, animation graph and camera director. Prove three reactions: unnecessary early brake, exact textbook stop, and genuinely unsafe driving.

## R5 — Social Bus

Add conductor, passenger manifest, seat/standing assignments, boarding/alighting, body-sway reactions, ambient barks and conversation scheduling.

## R6 — Endless Route

Implement chunk ring buffer, seeded sequencing, origin shifting, lane traffic, object pools and at least six chunk families. Pass a 15-minute seam/memory/repetition test.

## R7 — Encounter + Score Attack

Turn the old level jokes into organic encounters. Add Score, Flow multiplier, Examiner Approval, cooldown/history and difficulty escalation.

## R8–R11 — Production Finish

R8: native Malayalam rewrite + voice and authentic audio production.  
R9: diegetic depot menu, minimal HUD, settings and local high scores.  
R10: visual/audio finish, weather, LOD, mobile and offline performance.  
R11: judge-build lock, deterministic showcase seed and rollback-tested deployment.

## Absolute sequencing rule

**Driving feel first. Hero bus/world/story pillars second. Endless content machinery only after those pillars work.** Do not decorate or scale a bad-feeling controller.