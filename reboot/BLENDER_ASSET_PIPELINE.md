# Blender / 3D Asset Pipeline

Blender is not currently installed on the Oracle VM. Do not block R1 on it; R1 uses greybox geometry. Before R2, prepare a reproducible Blender pipeline on a machine suitable for interactive modeling, with headless validation/export optionally mirrored on Oracle.

## Unit/orientation contract

- 1 Blender unit = 1 metre.
- Y-up conversion handled consistently at export/import; test once and document.
- Apply scale on final export assets.
- Origins/pivots named deliberately for wheels, door, wipers, steering, lights and camera anchors.
- Bus forward axis convention must match the physics wrapper and never change mid-project.

## Bus V2 source organization

Collections:
`BODY_EXT`, `BODY_INT`, `WHEELS`, `DOOR`, `WIPERS`, `LIGHTS`, `DASH`, `SEATS`, `RAILS`, `GLASS`, `COLLISION_REF`, `CAMERA_ANCHORS`.

Keep simple collision/reference geometry separate from render meshes.
## Modeling order

1. Block dimensions/silhouette against chase-camera screenshots.
2. Wheelbase, wheel wells and overhangs.
3. Front/rear identity and window rhythm.
4. Door/steps and partial interior shell.
5. Driver/examiner/conductor spaces.
6. Seats/rails as instanced/reused modules.
7. Hero exterior details and mirrors/lights/wipers.
8. UV/material pass.
9. LOD/simplification pass after the high visual target is accepted.

Do not spend time modeling engine/mechanical detail invisible from gameplay/cinematics.

## Export

Runtime target is GLB. Validate node names, transforms, animation/pivot behavior, material count, texture paths, dimensions and bounding box in an automated post-export checker.

Keep `.blend` source outside runtime bundle. Generated runtime GLB should have a documented source revision/hash in the asset ledger.