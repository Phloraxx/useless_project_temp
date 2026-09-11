# Character + Animation Bible

## Character hierarchy

### Tier A — persistent hero characters
Examiner and conductor. Unique silhouettes, authored clothing, facial/head movement, dedicated animation states and voice identity.

### Tier B — encounter passengers
4–8 nearby passengers whose boarding, seating and reactions are visible. Reusable body rigs with curated clothing/hair/accessory combinations and named bark personalities.

### Tier C — background population
Lower-cost pooled pedestrians and waiting passengers. Fewer bones/materials, limited animation set, aggressive LOD/culling.

## Rig foundation

Use one shared humanoid skeleton whenever possible. The downloaded Quaternius Standard character/animation packs are CC0 and provide a compatible prototype foundation.

Three.js `AnimationMixer`/`AnimationAction` should handle base clips and crossfades. Character state machines select semantic actions; gameplay code should not directly reference animation filenames everywhere.
## Required animation graph

Passenger locomotion: `idle ↔ walk ↔ queue/turn ↔ step-up/board ↔ aisle-walk ↔ sit-enter ↔ sit-idle ↔ sit-talk ↔ sit-exit ↔ aisle-walk ↔ alight`.

Standing passenger: `idle-rail`, `talk`, `phone`, `brace`, `look`, `bell/request`, `walk`.

Examiner: seated idle, clipboard write, look-driver, look-road, tiny nod, head shake, fold arms, annoyed pause, speaking gestures, major-fail reaction.

Conductor: standing rail idle, aisle walk, door look-out, bell gesture, ticket/counting gesture, passenger interaction, brace, call-to-driver.

Existing Quaternius clips already cover driving, idle/talking, sit enter/idle/talking/exit, walk/formal walk, phone, fold arms, rail idle/call, interact and hit/knockback prototypes. Custom bus-specific clips fill the gaps.
## Physics-reactive micro-animation

Every bus occupant receives filtered chassis acceleration and angular-rate signals.

Additive reactions:
- longitudinal acceleration → torso/head lean back;
- braking → lean/brace forward;
- lateral acceleration → side sway opposite turn;
- speed-breaker impulse → vertical compression/head lag;
- sharp event → hand/rail brace or short reaction clip depending on state.

These reactions must be subtle during normal driving and stronger only near authored thresholds. Do not make passengers ragdolls during ordinary gameplay.

The examiner should react less than ordinary passengers; restraint makes the character authoritative and funny. A tiny clipboard correction after a hard brake can sell the physics better than a huge animation.

## Boarding system

Stops expose queue points, door target, aisle spline and seat slots. NPCs reserve targets before moving to avoid overlap. Door boarding is deterministic enough for cinematics but can run concurrently with background traffic.
## Kerala character styling

Everyday variety matters more than festival costume. Initial wardrobe modules should cover:
- shirts + trousers/jeans;
- T-shirts/polos;
- mundu/lungi combinations for some adult/older male characters;
- saree variants for some adult/older women;
- salwar/churidar/kurta variants;
- contemporary tops/trousers/jeans;
- school/college bags and simple uniform variants;
- head-scarf/hijab options where appropriate;
- sandals, shoes and slippers;
- umbrellas, shopping bags, small luggage, phones.

Vary age, height, build, skin tone, hair and posture. Do not encode district/community identity only through costume.

## Character performance budget

Only nearby Tier A/B characters use full animation updates every frame. Distant characters update at reduced rates or use simplified rigs/animation sampling. Pool characters and reuse skeleton-compatible materials/clothing atlases.

R5 acceptance: boarding/alighting works repeatedly without clipping catastrophes, occupants visibly react to vehicle motion, examiner/conductor remain readable during camera cuts, and 15 minutes of spawning/despawning shows no mixer/object leak.