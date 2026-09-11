# Asset Curation Status

## Raw versus curated

`assets/raw/` and `audio/raw/` preserve downloaded source archives exactly as acquired.

`assets/curated/` and `audio/curated/` contain only candidates worth evaluating in production. They are not automatically approved final art/audio.

## Current curated visual library

**Kenney roads:** 14 GLBs covering straight/curve/bend/intersection/crossroad/roundabout/bridge/crossing plus barrier, cone, utility pole/wires, blank sign and traffic light.

**Kenney nature:** 16 GLBs covering six palm variants, bushes, grass and rock variants.

**Quaternius:** UAL1 + UAL2 animation GLBs (43 clips each), male/female Standard base character glTF assets and required textures.

**Lighting:** two 1K cloudy HDR candidates from Poly Haven.

All source families above are CC0 based on the source archive/page licenses recorded in `SOURCE_LEDGER.md`.
## Validation performed

- archive licenses inspected directly;
- raw archive SHA-256 values recorded;
- curated files individually hashed in `CURATED_SHA256SUMS.txt`;
- animation GLBs parsed and animation names exported to `assets/curated/quaternius/ANIMATION_MANIFEST.json`;
- curated character glTF dependencies checked;
- the supplied Standard character glTFs referenced two `_png` texture aliases absent from the archive, so **only the curated copies** were patched to reference the equivalent included PNG names; raw archive remains untouched;
- resulting curated character glTF dependency check passes.

`CURATED_ASSET_MANIFEST.json` provides machine-readable path, byte-size and hash information.

## Runtime policy

Do not copy the whole 52 MB curated visual library into production blindly. R1 requires no character/world library at all. R2/R3 import candidates selectively, convert/retexture where needed, and measure final transfer/GPU cost.

Quaternius characters are prototype/base rigs, not final Kerala people. Their geometry/rig may be retained while clothing, hair, textures and proportions are re-authored.