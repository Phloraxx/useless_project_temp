# R2 Hero Bus + Interior Asset Specification

Status: pre-production contract. R1 physics remains frozen until blind playtest feedback.

## Vehicle identity

The hero bus is a fictional Kerala route bus. It may evoke familiar front-engined Indian public buses, but it must not reproduce an operator logo, exact livery, registration plate or one body builder's face.

Target character: tall, work-worn, mechanically simple, slightly stubborn, recognisable from silhouette at phone scale. The bus should feel like a social space, not merely a vehicle shell.

## Dimensional target

Use real full-size Indian bus dimensions as sanity bounds, not as a licensed design drawing.

- overall length: `10.95 m`
- overall width: `2.55 m`
- roof height from road: `3.20–3.30 m`
- wheelbase: `5.45 m` to match R1 physics
- wheel radius: `0.48 m`
- front overhang target: `~2.40 m`
- rear overhang target: `~3.10 m`
- right-hand-drive driver position
- front passenger door on vehicle left

Coordinate convention: `+Z forward`, `+Y up`, `+X vehicle right`. Origin is the wheelbase midpoint on the road plane.

## Geometry budgets

The bus is the hero object and may spend most of the run close to camera.

- LOD0 exterior + partial interior: target `55k–75k` visible triangles
- LOD1: target `25k–35k`
- LOD2: target `8k–12k`
- collision is never derived from the render mesh
- repeated seats, rails and handles should reuse meshes/materials
- tiny text, grime and panel wear should live in textures/decals, not geometry

Blockout may be much lighter. These are final production ceilings, not minimum targets.

## Exterior silhouette priorities

1. tall rectangular cabin with softened corners
2. large front glazing with a fictional destination-board zone
3. clear front-engine / utility-bus stance
4. strong wheel placement and visible overhangs
5. front-left passenger door and steps
6. readable window/pillar rhythm along both sides
7. mirrors and wipers large enough to read in gameplay
8. lower-body wear, panel seams and repairs for personality

Do not spend polygons on invisible underbody detail before silhouette, door, windows and interior framing are correct.## Interior gameplay priorities

The interior is a gameplay stage, not a full simulator interior.

- driver seat and steering area must support driver/examiner two-shots
- examiner seat must have a clean sightline to driver and road
- conductor needs a home position near front door plus aisle movement space
- aisle must remain wide enough for animated passenger traversal
- seat rows need consistent reservation sockets for NPC placement
- overhead/vertical rails are important Kerala-bus visual language and animation targets
- front steps and door threshold must support boarding animation
- rear-most invisible mechanical areas may be simplified aggressively

Target usable interior width is roughly `2.30–2.35 m`. Use a `2 + aisle + 2` seat rhythm where practical, but reduce or remove rows around the examiner, front door and conductor space when cinematics need room.

## Animation requirements

The visual bus is mounted to the R1 rigid chassis. It must expose independent pivots/nodes for:

- four wheels
- front wheel steering
- front passenger door
- steering wheel
- left/right wipers
- left/right mirrors if later micro-animation is useful
- headlight / brake / indicator emissive groups

Suspension/body roll is applied by game code to the visual root; it must not be baked into the mesh rig.
## Interior blockout contract

The partial interior must support gameplay/cinematics before decorative detail.

- clear front entry with 2–3 visible steps
- right-hand driver seat and steering position
- examiner seat immediately behind/offset from driver with clear two-shot camera line
- conductor standing/leaning zone near the front door and aisle
- central aisle wide enough for one animated passenger at a time
- repeated paired seating modules, simplified at blockout stage
- overhead longitudinal rails plus vertical grab poles
- small luggage rack language along the upper side wall
- open view through side windows so seated passengers remain readable from exterior shots
- front interior ceiling/headliner volume for rain/audio context

The first blockout only needs enough seats to prove scale, sightlines and animation clearances.

## Required runtime node names

The exported GLB must contain these stable nodes exactly:

- `BUS_ROOT`
- `BODY_VISUAL`
- `WHEEL_FL`, `WHEEL_FR`, `WHEEL_RL`, `WHEEL_RR`
- `DOOR_FRONT_PIVOT`
- `WIPER_L_PIVOT`, `WIPER_R_PIVOT`
- `STEERING_WHEEL_PIVOT`
- `LIGHT_HEAD_L`, `LIGHT_HEAD_R`, `LIGHT_BRAKE_L`, `LIGHT_BRAKE_R`
- `INDICATOR_FL`, `INDICATOR_FR`, `INDICATOR_RL`, `INDICATOR_RR`

## Required sockets / empties

These are authored as empties and exported with the GLB:

- `SOCKET_DRIVER_HEAD`
- `SOCKET_EXAMINER_HEAD`
- `SOCKET_CONDUCTOR_HOME`
- `SOCKET_DOOR_ENTRY`
- `SOCKET_AISLE_FRONT`
- `SOCKET_AISLE_MID`
- `SOCKET_AISLE_REAR`
- `CAM_CHASE_TARGET`
- `CAM_FRONT_3Q`
- `CAM_SIDE_STOP`
- `CAM_INTERIOR_DRIVER`
- `CAM_INTERIOR_EXAMINER`
- `CAM_INTERIOR_TWO_SHOT`
- `CAM_DOOR_BOARDING`

Seat sockets use `SEAT_01` … `SEAT_NN`. Standing/grab positions use `STAND_01` … `STAND_NN`.

## Pivot behavior

- wheel origins sit exactly at axle centres
- front wheels rotate for spin and yaw for steering in the runtime wrapper
- front door pivots from the real hinge/slide axis chosen for the fictional design
- wiper pivots sit at their spindle points
- steering-wheel origin sits on steering-column axis
- lights stay separate so emissive intensity can be changed without material surgery
- `BODY_VISUAL` receives presentation roll/pitch/heave while `BUS_ROOT` follows physics

## Material hierarchy

Blockout materials stay simple but final naming should already be stable:

- `MAT_BODY_RED`
- `MAT_BODY_CREAM`
- `MAT_BODY_DARK_TRIM`
- `MAT_GLASS`
- `MAT_RUBBER`
- `MAT_METAL_PAINTED`
- `MAT_METAL_BARE`
- `MAT_INTERIOR_BLUEGREY`
- `MAT_RAIL_YELLOW`
- `MAT_SEAT_DARK`
- `MAT_LIGHT_LENS`
- `MAT_DESTINATION_BOARD`

Final visual direction is stylized PBR, not photorealism: broad readable roughness differences, restrained grime, worn edges and panel variation. Avoid 4K texture-per-part workflows.

## R2 blockout acceptance gate

The first Blender blockout passes only if:

1. dimensions and wheelbase match the R1 physics contract
2. chase view reads as a Kerala/South-Indian route-bus class without copied branding
3. front door, driver, examiner and aisle proportions are believable
4. all required runtime nodes/sockets exist and have sane transforms
5. one exterior chase shot and one driver/examiner two-shot can be framed without clipping
6. exported GLB validates on Oracle and can be mounted as a pure visual child of R1 physics

Do not texture/detail beyond what is needed to answer those questions.