# Audio Bible

## Goal

The bus must sound alive even when nobody speaks. Audio is a continuous simulation layer tied to physics, surface, weather, doors, people and world zones.

Do not use a single engine loop, oscillator horn or global ambience track as final audio.

## Mixer buses

`MASTER`
- `VEHICLE_PLAYER`
- `VEHICLE_WORLD`
- `INTERIOR_MECHANICAL`
- `AMBIENCE_BG`
- `AMBIENCE_MID`
- `FOLEY`
- `DIALOGUE_HERO`
- `DIALOGUE_BARKS`
- `UI`
- `MUSIC_STING` (optional/sparse)

Expose settings for master, effects, dialogue and ambience. Dialogue ducking should reduce competing ambience slightly, not mute the world.
## Player-bus sound model

Engine uses several loop regions/layers mapped by RPM/load proxy, with crossfades rather than pitch-shifting one sample across the entire range.

Required layers/events:
- ignition/start and shutdown;
- idle;
- low/mid/high load diesel layers;
- drivetrain/gear whine proxy;
- tire/road loop by speed + surface;
- body/window/handrail rattles driven by roughness and chassis acceleration;
- suspension thumps;
- air-brake application/release hiss;
- occasional brake squeak;
- dual-tone horn with short/held behavior;
- indicator relay;
- conductor bell;
- pneumatic/mechanical door;
- wiper motor + wipe contact;
- rain on roof/glass/interior shell.

R1 may use the downloaded CC0 engine loops as placeholders. R8 replaces the signature engine/horn/interior layers with authentic heavy-bus recordings.
## World ambience model

Use three depth layers:

**Background bed** — broad environment: distant traffic, insects/birds where appropriate, wind, rain, open-field bed.

**Midground zones** — authored spaces: market murmur, tea shop, school gate, auto stand, bus stand, rain under awning.

**Foreground emitters** — individual vehicles, horns, footsteps, doors, nearby conversations, shop radio-like texture only if licensed/original.

Spatial foreground sounds use Web Audio/Three positional audio. `PannerNode` provides position/orientation/distance and cone behavior; use HRTF for hero sources where cost is acceptable and equal-power/simple panning for cheap/distant sources.

Do not spatialize the player engine as if the listener is a pedestrian behind the bus. Mix player-bus audio as a camera/interior-aware hybrid and crossfade perspective during cinematic interior shots.
## Dialogue recording direction

Examiner: dry, calm, middle-aged or older authority; never performs the punchline. Keep breaths and tiny pauses where natural.

Conductor: more mobile/energetic, practical, occasionally talks over ambient noise.

Passengers: conversational distance and imperfect timing; avoid everyone sounding like voice actors standing at a microphone.

Record dry hero dialogue where possible, then add positional/distance treatment in-engine. For ambient barks, record small groups and overlapping variants separately.

File target after edit: mono 48 kHz source masters; delivery as efficient OGG/WebM/AAC-compatible browser assets after listening tests. Preserve WAV masters outside runtime.

## Audio acceptance

Mute visuals mentally: acceleration/braking/surface/weather should still be intelligible by sound. No loop seam may be obvious during a 5-minute run. A dialogue line must remain intelligible on laptop speakers without crushing all ambience.

The CC0 prototype audio already downloaded is engineering material, not final signature sound.