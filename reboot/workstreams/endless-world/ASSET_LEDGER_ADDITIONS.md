# Endless World — Asset Ledger Additions

This workstream adds no newly downloaded third-party art.

## Runtime external asset

| ID | Runtime path | Upstream/source | License | Use |
|---|---|---|---|---|
| HDR-RED | `public/assets/lighting/red_hill_cloudy_1k.hdr` | Existing reboot curated copy of Poly Haven `red_hill_cloudy` 1K HDRI | CC0 | Overcast environment/IBL candidate |

The source and SHA-256 provenance for `HDR-RED` already exists in the reboot root `SOURCE_LEDGER.md` and `CURATED_SHA256SUMS.txt`. The workstream copy is derived only from `reboot/assets/curated/lighting/red_hill_cloudy_1k.hdr`.

## Project-original runtime content

The following visible prototype content is generated from original TypeScript/Three.js geometry and therefore does not require an external art license:

- road, laterite shoulder, drainage and terrain ribbons;
- concrete/tiled houses and shopfront prototypes;
- tea shop, bus shelter, market stall, compound wall and gate prototypes;
- utility poles and batched utility-wire runs;
- palm, banana and jackfruit silhouette prototypes;
- auto, bike and parked-car placeholder silhouettes;
- paddy plots, canal, bridge parapets, tarpaulin/corrugated structures;
- Malayalam sign/poster textures generated at runtime with Canvas 2D;
- debug bus and spawn-socket markers.
## Curation decision

Kenney road/nature source assets remain available under the reboot-wide curated library, but this lab does not ship those GLBs. Early copied candidates were removed from `public/` once the authored prototype geometry proved sufficient. This keeps provenance simple and avoids an asset-pack collage while leaving the CC0 curated sources available for later remodeling/retexturing.

No exact real operator branding, route reproduction, or licensed KSRTC marks are present in this world workstream.
