# Art Direction Bible

## Target

**A fictional Kerala remembered through a polished PS2/early-HD-era game lens, with Bully-like social density and modern lighting/material discipline.**

Do not imitate Bully assets or UI. Borrow the authored-density principle: readable characters, strong silhouettes, compact social spaces, stylized but grounded environments.

## Rendering language

- stylized PBR, not flat unlit low-poly;
- broad shapes first, bevels where light needs to catch;
- restrained normal/roughness detail;
- baked/painted grime and AO rather than geometry noise;
- slightly exaggerated silhouettes for chase-camera readability;
- filmic but not desaturated grading;
- overcast daylight as the default Kerala mood;
- monsoon states deepen contrast through wet materials and warm interiors.

Use a 1K HDR environment through Three.js PMREM for image-based lighting, plus one main directional light/shadow system. Reserve extra lights for close hero spaces.
## Hero bus V2

The bus is the visual anchor and may spend 30k–60k visible triangles including partial interior.

Required exterior pieces: shaped front/rear body, wheel arches, mirrors, grille, lamps, indicators, bumpers, windows/glass, wipers, destination board, roof vents/details, working door and believable wheels/tires.

Required interior pieces: driver's wheel/dashboard silhouette, examiner seat, conductor standing zone, entry steps, handrails, 10–16 readable seats, window frames and enough ceiling/floor structure for interior camera cuts.

Animation/physics hooks: front-wheel steer, wheel spin, suspension travel, body roll/pitch, door open/close, wipers, lights/indicators, steering wheel, subtle mirror/body vibration.

Palette: fictional muted red/cream family may remain, but repaint from scratch with aged roughness, subtle dirt and material separation. No official KSRTC marks or exact operator livery.
## World material families

Keep a controlled material library instead of unique materials per prop:
- asphalt dry / patched / wet;
- laterite earth / gravel;
- painted concrete variants;
- exposed concrete;
- tile roof;
- corrugated metal;
- weathered painted metal;
- tarp/plastic;
- dark timber;
- glass;
- tropical leaf families;
- sign/poster atlas.

Most props should share atlases/material instances. Hero shopfronts and the bus may have unique textures.

## Lighting and weather

Default: bright overcast, soft-edged shadows, humid atmospheric depth, restrained speculars. Rain states progressively increase road/roof/glass response, reduce direct sunlight, add wipers/rain audio and selective puddle decals/planes.

Do not use expensive screen-space reflections as a requirement. The wet look should survive through roughness/specular/material changes and environment reflections alone.
## Asset source policy

Downloaded Kenney/Quaternius packs are **source libraries**, not final art direction. Every visible imported asset must be remodeled/recoloured/recomposed enough to belong to the world.

Prefer project-original Kerala-specific architecture and hero props. Use CC0 kits for road topology, vegetation bases, generic utility objects and prototyping.

## Visual acceptance

A screenshot with HUD hidden should still communicate Kerala/South India through ordinary details, not stereotypes. A screenshot with the bus removed should still look authored rather than like default asset packs.

At normal chase distance:
- bus silhouette must read immediately;
- passengers near stops must read as people with poses, not sticks;
- shop/house layers create depth on both sides of road;
- background clutter never competes with encounter cues;
- mobile low mode can simplify shadows/vegetation without flattening the scene.

No environment is considered final until it has been evaluated while driving, during a cinematic cut, and in rain.