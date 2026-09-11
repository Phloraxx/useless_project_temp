# World Design Bible — Endless Kerala Route

## Principle

The route must feel authored even when it can continue indefinitely. Do not generate arbitrary road noise. Build a library of hand-composed road chunks with clear social identity, then sequence and remix them with controlled randomness.

A chunk is not only road geometry. It contains:
- road spline and lane metadata;
- shoulder, drain and terrain edges;
- traffic and pedestrian spawn sockets;
- bus-stop and encounter sockets;
- audio zones;
- cinematic camera anchors;
- occlusion/LOD groups;
- semantic tags such as `market`, `residential`, `paddy`, `junction`, `school`, `bridge`.

## Streaming model

Keep roughly 5–7 chunks alive around the player. Spawn ahead, recycle behind, and periodically shift world origin to avoid floating-point drift.

Chunk length target: usually 40–100 m. Long quiet/open chunks may reach 150 m. Dense town chunks should be shorter so landmarks and encounters arrive at a believable rhythm.
## Initial chunk families

1. **Depot / bus stand** — run start, examiner/conductor entry, parked buses, tea counter, route board.
2. **Town high street** — close shopfronts, autos, pedestrians, frequent side roads, sign clutter.
3. **Residential ribbon** — compound walls, gates, houses, school/tuition traffic, narrow shoulders.
4. **Market / junction** — denser pedestrians, parked vehicles, crossing intent, horn-heavy encounter space.
5. **Paddy / open stretch** — long sightlines, water/field edge, palms, fewer people, stronger vehicle feel.
6. **Bridge / canal** — constrained width, parapets, approach bend, audio reflection opportunity.
7. **Curving green road** — vegetation, grade changes, bus body-roll showcase.
8. **Roadworks / broken surface** — cones, gravel, temporary lane shift, suspension showcase.
9. **School/college stop** — groups, backpacks, buses/autos, boarding pressure.
10. **Rain-heavy settlement** — awnings, umbrellas, puddles, wipers, warm shop light.

The first production slice only needs Depot + Residential + Bus Stop + one Junction. Six or more families are required before the endless-route gate passes.
## Kerala visual grammar

World identity comes from combinations rather than one iconic prop: open drains, laterite shoulders, concrete utility poles, tangled service wires, tiled/concrete roofs, compound walls, Malayalam boards, awnings/tarpaulins, bus shelters, autos, scooters, vegetation growing close to structures, and abrupt transitions between dense settlement and open green land.

Avoid turning every chunk into a postcard. Ordinary Kerala is the target: faded paint, repair patches, shuttered shops, plastic chairs, flex-board frames, parked scooters, rain marks, mismatched additions to buildings, small shrines/church/mosque cues only when authored carefully, and modern commercial clutter.

## Population and traffic density

Density is event-driven and budgeted. A market chunk can have many low-cost distant characters while the bus-stop encounter reserves higher-quality animated characters near the camera.

Traffic uses lane splines and behavior archetypes, not full autonomous-city simulation. Critical encounter vehicles are authored agents. Background traffic may be simpler and pooled.

## Repetition control

The sequencer tracks the last N chunk families, landmark variants, weather states and encounters. Never repeat the same hero storefront, stop shelter or encounter in adjacent chunks. Palette and prop sets can vary by seeded district/theme without pretending to reproduce real geography.
## World acceptance tests

A chunk is not accepted because it looks good in the editor. It must pass from the chase camera at driving speed.

Required checks:
- silhouette/readability at 35–55 km/h;
- no visual collision with the bus camera;
- stop/encounter cue visible early enough to react;
- no obvious chunk seam from road, shoulder, lighting or traffic;
- Malayalam signage legible only when intended, not billboard-sized everywhere;
- audio zone crossfades do not pop;
- pedestrians cannot spawn into the bus path without authored logic;
- mobile quality mode can remove decoration without destroying Kerala identity.

## World performance budget

Favor instancing for vegetation, poles, barriers and repeated props. Use pooled traffic/NPCs. Hero spaces may spend more geometry, but the visible world should stay materially coherent and avoid unique 4K textures.

The target is a small authored world library with high reuse quality, not a giant asset count.