# Endless World Workstream Handoff

Status: READY FOR INTEGRATION — 2026-09-12

Workspace: `/home/drvij/projects/adutha-stoppil/reboot/workstreams/endless-world`

## Implemented
- Deterministic seeded `WorldStreamer` with 5–7 live authored chunks.
- Chunk pooling/recycling and logical route distance separate from render coordinates.
- Invisible world-origin rebasing at a default 520 m threshold.
- Spawn sockets for traffic, pedestrians, bus stops, shops, encounters, cameras and audio zones.
- Six authored prototype families: town high street, residential ribbon, tea-stop, market/junction, paddy/open road and bridge/green road.
- Quality tiers and original Kerala roadside prototype geometry.
- Existing CC0 Poly Haven overcast HDRI only; no new third-party art was added.

## Runtime API
Primary integration surface: `src/world/WorldStreamer.ts` plus `types.ts`, `chunks.ts`, `path.ts` and `prng.ts`.

Construct with `{ seed, minLive?, maxLive?, rebaseThreshold? }`, then call `update(logicalDistanceM)`.
The returned `WorldSnapshot` contains logical/global player pose, render-space player pose, origin epoch, rebase count, live chunks, pool counts and generated count.
## Independent validation
Re-run on Oracle on 2026-09-12:
- `npm run build` — PASS
- `npm run lint` — PASS, 0 warnings / 0 errors
- `npm run test:streamer` — PASS; 204 chunks observed, all 6 families, 5–7 live, 37 rebases
- `npm run benchmark` — PASS; 50 km logical route, 506 generated chunks, 94 rebases, peak 7 live chunks

Existing BigMac Metal browser benchmark:
- desktop-high 1440×900: ~60 FPS average
- mobile-low 390×844: ~60 FPS average
- 6–7 live chunks maintained, all six families observed
These are accelerated streamer/render tests, not final integrated vehicle benchmarks.

## Integration guidance
- Keep the streamer's logical distance authoritative; never derive run distance from rebased render coordinates.
- Feed chunk `tags`, density and socket metadata into `EncounterContext` rather than hard-coding world knowledge in gameplay systems.
- Use `originEpoch` to rebase other world-space systems such as traffic, pedestrians and spatial audio in the same frame.
- Preserve deterministic seed domains; encounter random state must remain separate from world-sequence random state.
- Replace prototype geometry gradually. Do not discard the chunk metadata/schema when final art arrives.
- Chunk instances must remain pooled/recyclable; avoid attaching permanent React/gameplay state directly to transient render object identities.
## Known limitations
- Prototype world art is intentionally lightweight and not final hero-quality.
- Browser benchmarks do not include final bus, passengers, traffic, audio and cinematics together.
- Traffic/pedestrian simulation is represented by sockets, not a full production crowd/traffic system.
- Final mobile performance must be re-measured after V3 integration.
- Main bundle still triggers a Vite >500 kB warning.

## Evidence
- `reports/streaming-benchmark.json`
- `reports/browser-soak.json`
- `reports/bigmac-browser-benchmark.json`
- `screenshots/final/`
- `ASSET_LEDGER_ADDITIONS.md`

No live R1/R2 folder was modified by this workstream.