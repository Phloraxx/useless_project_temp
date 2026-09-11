# V3 Cross-Workstream Integration Contract

## Vehicle
- Physics mass: 13,200 kg effective.
- Wheelbase: **5.64 m**.
- Track width: 2.04 m.
- Wheel radius: 0.48 m.
- Fixed physics timestep: 1/60 s.
- Default tune: `Balanced` from physics workstream.
- Rapier chassis is authoritative. Hero mesh never defines collision/mass.

## Steering/input
- Canonical steering sign: left = `-1`, right = `+1`.
- Keyboard, analog touch and virtual buttons use the same convention.
- Touch UI must never independently invert physics steering.
- `S`/brake slows forward motion first, then requests reverse near stop.

## Drivetrain/audio telemetry
Required fields: `speedKmh`, `gear`, `normalizedRpm`, `drivetrainLoad`, `shifting`, `shiftProgress`, `shiftSerial`, `throttle`, `brake`, `surface`, plus body/acceleration telemetry.

Shift event browser contract: `adutha:drivetrain-shift` with `{serial, fromGear, toGear, reason}`.
Audio consumes telemetry; audio never invents drivetrain state.
## Bus asset contract
Runtime hero bus: `workstreams/bus-authentic/output/bus_authentic_PUBLIC_PARODY.glb`.

Canonical roots/pivots/sockets include `BUS_ROOT`, `BODY_VISUAL`, `INTERIOR_ROOT`, four `WHEEL_*` nodes, `PIVOT_DOOR_FRONT`, `PIVOT_STEERING_WHEEL`, `PIVOT_WIPER_L/R`, light nodes, `SOCKET_DRIVER`, `SOCKET_EXAMINER`, `SOCKET_CONDUCTOR_HOME`, `SOCKET_DOOR_ENTRY`, seat/aisle/standing sockets and `CAM_*` sockets.

The LOCAL_REFERENCE GLB and original downloaded source are excluded from public shipping/source until redistribution rights are confirmed.

## Characters
Gameplay requests semantic states such as `sitIdle`, `sitTalk`, `railIdle`, `walk`, `sitEnter`; gameplay never requests raw clip filenames.

Vehicle-local motion signals: longitudinal acceleration, lateral acceleration and vertical impulse. Examiner motion gain remains deliberately restrained.

## World
`WorldStreamer.update(logicalDistanceM)` returns 5–7 active chunks and rebased render coordinates while preserving global logical route distance.

Chunk-local sockets must be transformed by the chunk start pose. Encounter selection receives chunk family/tags, density, weather, passenger count and relevant socket/geometry tags.

Seed determinism is preserved across world and encounter systems.
## Gameplay/scoring
Physics/world produce semantic driving events. `ExaminerScoring` is the only system that classifies them into qualification success/mistake, safety penalty, fatal failure or neutral.

Serious collision/pedestrian/loss-of-control events are never rewarded. Score decisions expose stable `reasonCode`, score/Flow/approval changes and optional grading-cinematic request.

## Cinematics
`CinematicDirector` consumes real `SafetyState` and owns presentation-camera transitions. Unsafe situations fall back to micro-reaction/subtitle rather than pausing the world.

`gameplayTimeScale` and `inputAuthority` are applied at simulation/input boundaries. A safe cinematic may not freeze one subsystem while traffic/pedestrians continue unsafely.

## Dialogue
Dialogue lookup key is semantic `trigger` + speaker/persona + cooldown/history. `reasonCode`/encounter outcome maps into dialogue triggers through one adapter.

`DIALOGUE_V3.json` remains authored source. Native review is still pending for every line, so V3 subtitles may use these drafts but recorded hero voice is not production-locked.

## First vertical-slice acceptance
- depot/menu start;
- authentic PUBLIC_PARODY bus with Balanced physics;
- audible layered engine and gear shifts;
- animated seated examiner and conductor/passenger proof;
- minimum 3 authored road chunks;
- 3 encounter beats with score/Flow;
- 1 safe examiner grading cinematic plus unsafe fallback behavior;
- Malayalam subtitle/dialogue data;
- one boarding/alighting beat;
- build/lint/runtime proof before extending endless content.
