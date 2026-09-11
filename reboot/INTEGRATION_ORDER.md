# V3 Integration Order

Date: 2026-09-12
Status: all nine parallel workstreams have handoffs and have been independently checked where executable.

## Accepted workstreams

1. `physics-drivetrain` — accept Balanced tune as vehicle source of truth.
2. `bus-authentic` — accept PUBLIC_PARODY GLB as runtime hero-bus candidate.
3. `audio-system` — accept AudioEngine + 20 processed runtime OGGs.
4. `characters` — accept animation architecture/state graph/motion overlay; hero meshes remain placeholders.
5. `endless-world` — accept streamer/chunk schema/six authored chunk families.
6. `gameplay-systems` — accept EncounterDirector/ExaminerScoring/PlayerRunState.
7. `cinematics-ui` — accept CinematicDirector, camera states, menu/HUD presentation.
8. `dialogue-v3` — accept structured authored data, but all lines remain pending native review before voice recording.
9. `story-design` — accept V3 premise, progression, encounter bank and Flow/scoring direction.

## Integration sequence

Physics/input/drivetrain → authentic bus visual → audio → characters → world streamer → gameplay systems → cinematics → dialogue/story data → menu/HUD.

Do not integrate all authored content initially. First prove a 3–5 minute vertical slice containing three chunks and three encounters.
