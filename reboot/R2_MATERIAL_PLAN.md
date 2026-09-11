# R2 Bus Material Plan

The bus should look authored and worn, not photoreal and not flat-shaded toy plastic.

## Core material set

Keep the final hero bus near 8–10 material families:

1. `MAT_BODY_RED` — muted deep red painted sheet metal
2. `MAT_BODY_CREAM` — warm aged cream accent/body panels
3. `MAT_GLASS` — lightly dirty/tinted windows and windscreen
4. `MAT_RUBBER` — tyres, seals, flexible trim
5. `MAT_DARK_METAL` — grille, underbody and blackened hardware
6. `MAT_PAINTED_INTERIOR` — cool blue/grey painted interior sheet metal
7. `MAT_SEAT_VINYL` — worn blue/green vinyl with edge wear
8. `MAT_RAIL_YELLOW` — painted grab rails/poles
9. `MAT_CHROME` — sparse polished rail/luggage-rack accents
10. `MAT_FLOOR` — dark patterned/ribbed bus floor

Destination board, posters and tiny notices should be atlas/decal content rather than unique materials where possible.## Texture strategy

Final LOD0 target:

- one 2K exterior atlas for paint, seams, dirt, logos/signage and roughness variation
- one 2K interior atlas for seats, rails, floor, painted metal and grime
- shared 1K glass/rubber/detail maps when needed
- normal detail should be subtle; large silhouette changes belong in geometry
- use AO/roughness/metalness channels efficiently rather than multiple redundant image files

Mobile should use reduced texture resolution and the lower bus LOD, not a different art direction.

## Wear language

Wear is concentrated where humans and roads create it:

- lower-body mud and splash accumulation
- door threshold and step scratches
- hand/rail contact wear
- seat edge abrasion
- wheel-arch grime
- front-panel stone chips
- repaired/repainted panel variation
- dusty window edges and wiper-cleared windscreen arcs

Avoid uniform procedural noise. The wear should help explain how the bus is used.