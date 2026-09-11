# Reboot Task Backlog

Priority codes: `P0` blocks the next gate; `P1` required for gate; `P2` polish/deferred within gate.

## R0 — Research / asset preparation

- [x] P0 Preserve legacy prototype snapshot.
- [x] P0 Lock V2 product truth.
- [x] P0 Download CC0 Kenney roads/nature source packs.
- [x] P0 Download CC0 Quaternius Standard animation libraries 1+2.
- [x] P0 Download CC0 Quaternius Standard base characters.
- [x] P0 Download CC0 1K overcast HDR environment candidates.
- [x] P0 Download CC0 prototype engine/rain/footstep audio.
- [x] P0 Create reboot asset/source ledger with URLs, hashes and license text.
- [x] P1 Curate runtime candidates from raw packs.
- [ ] P1 Create reference boards for bus, roadside architecture, clothing and interior.
- [x] P1 Define Blender source/export pipeline; interactive Blender host still to be chosen before R2.

R0 closes when all downloaded material has provenance and curated candidates.
## R1 — Handling Lab

- [x] P0 Create reboot app/module entry separate from legacy game.
- [x] P0 Add Rapier dynamic chassis + four raycast wheels.
- [x] P0 Build greybox 400–600 m test course.
- [x] P0 Implement throttle/brake/steering input abstraction for keyboard + touch.
- [x] P0 Implement speed-sensitive steering and input smoothing.
- [x] P0 Expose suspension/friction/engine/brake parameters in debug UI.
- [x] P0 Add wheel contact/suspension/slip telemetry.
- [x] P0 Add spring chase camera + obstacle probe.
- [x] P1 Add asphalt/wet/laterite surface metadata and behavior.
- [ ] P1 Add anti-roll/yaw assists only after base tuning.
- [x] P1 Add placeholder engine/tire/brake audio driven by telemetry. (Engine layers done; tire/brake still refinement.)
- [x] P1 Save/load named handling presets.
- [x] P1 Build blind Heavy/Balanced/Arcade human comparison harness with local JSON export.
- [ ] P1 Run desktop 5-minute handling test and real-phone control test.

**Gate:** grey bus + grey road is enjoyable and stable without dialogue/art.
## R2 — Hero Bus + Interior

- [ ] P0 Model Bus V2 exterior to final silhouette quality.
- [ ] P0 Model partial interior with driver/examiner/conductor/seat spaces.
- [ ] P0 Create clean pivots/nodes for wheels, steering, door, wipers, lights.
- [ ] P0 UV/material pass with aged stylized PBR treatment.
- [ ] P0 Bind visual transforms to R1 chassis/wheels.
- [ ] P1 Add steering wheel, door, wiper, indicator/headlight animation.
- [ ] P1 Create chase/interior LOD strategy.
- [ ] P1 Tune bus camera framing against final silhouette.

## R3 — Living Kerala Slice

- [ ] P0 Build one near-final 100–200 m roadside chunk.
- [ ] P0 Create stop + tea shop + 2–3 house/shop modules + drains/shoulders.
- [ ] P0 Establish HDR/PMREM lighting + material palette.
- [ ] P0 Integrate first animated passenger characters at stop.
- [ ] P1 Add traffic/auto/scooter placeholders with lane metadata.
- [ ] P1 Add ambience zones and positional foreground emitters.
- [ ] P1 Validate high/medium/mobile visual tiers.
## R4 — Examiner + Cinematic Grading

- [ ] P0 Build examiner character variant and seated animation graph.
- [ ] P0 Implement clipboard prop/marking micro-animation.
- [ ] P0 Implement semantic grade request/result model.
- [ ] P0 Implement cinematic safe-state handshake.
- [ ] P0 Implement chase ↔ examiner shot transitions.
- [ ] P0 Prove exact-stop grading beat.
- [ ] P0 Prove unnecessary-brake grading beat.
- [ ] P0 Prove major-collision/disqualification beat.
- [ ] P1 Add silent glance/nod/head-shake grading without camera cut.
- [ ] P1 Add score/Flow/Approval presentation after acting beat.

**Replacement checkpoint:** only after R4 may the reboot be considered for a new public preview URL.

## R5 — Social Bus

- [ ] P0 Conductor character + aisle/door behavior.
- [ ] P0 Passenger manifest, queue, seat/standing reservations.
- [ ] P0 Board → aisle → sit → exit flow.
- [ ] P0 Physics-reactive sway/brace additive animation.
- [ ] P1 Ambient bark scheduler and passenger mood.
- [ ] P1 Clothing/body/hair/accessory variation system.
## R6 — Endless Route

- [ ] P0 Define chunk data schema and connection contracts.
- [ ] P0 Implement 5–7 chunk ring buffer and recycle lifecycle.
- [ ] P0 Implement deterministic seeded sequencer with repetition history.
- [ ] P0 Implement world-origin shifting.
- [ ] P0 Pool traffic, props and NPCs.
- [ ] P0 Author at least six chunk families.
- [ ] P1 Add lane graph/spline continuity across chunk boundaries.
- [ ] P1 Add chunk-specific audio/camera/encounter sockets.
- [ ] P1 Run 15-minute no-seam/no-leak test.

## R7 — Encounter + Score Attack

- [ ] P0 Build Encounter Director with history/cooldowns.
- [ ] P0 Implement Score, Flow and Examiner Approval.
- [ ] P0 Port/rewrite Stop, Auto/Horn and Stop-Request ideas as organic encounters.
- [ ] P0 Implement at least 8 varied encounters before content lock.
- [ ] P1 Add distance-based combination/difficulty escalation.
- [ ] P1 Add showcase seed and encounter replay debug controls.
- [ ] P1 Add run summary/local best comparison.
## R8 — Malayalam + Authentic Audio

- [ ] P0 Lock examiner/conductor/passenger casting plan.
- [ ] P0 Native-review every hero spoken line.
- [ ] P0 Record final examiner/conductor hero lines.
- [ ] P0 Record first 3 regional passenger pools.
- [ ] P0 Record/source authentic bus engine/horn/brake/door/interior sounds with rights.
- [ ] P0 Build layered engine and ambience mixer.
- [ ] P1 Mix subtitles/ducking/spatial dialogue on laptop + headphones + phone.

## R9–R11 — Product Finish

- [ ] R9 Diegetic depot menu, settings, controls, credits and local highscores.
- [ ] R9 Minimal in-run HUD and score/Flow feedback.
- [ ] R10 Rain/wet material final pass, visual/audio LOD, offline font/assets.
- [ ] R10 Mobile touch/camera/performance QA on real devices.
- [ ] R10 Accessibility: audio sliders, subtitles, camera shake, quality settings.
- [ ] R11 Freeze showcase seed and rehearse 2–3 minute judge route.
- [ ] R11 Fresh-browser/offline/rollback/deployment validation.
- [ ] R11 Final provenance/credits audit and submission package.

No multiplayer or remote leaderboard task enters this backlog until after R11.