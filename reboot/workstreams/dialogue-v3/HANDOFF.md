# Dialogue V3 Handoff

## Scope completed
This workstream rewrites the dialogue layer around believable spoken Kerala Malayalam while preserving the intentionally formal examiner rulebook register.

Source bibles read before writing:
- `DIALOGUE_LOCALISATION_BIBLE.md`
- `CHARACTER_STORY_BIBLE.md`
- `GAME_DESIGN_BIBLE.md`
- `TRUTH_V2.md`

No live R1/R2 code was changed. No OMP/Luna workflow was used.

## Deliverables
- `DIALOGUE_V3.json`: structured dialogue pool with 202 authored records.
- `CASTING_BIBLE.md`: voice, region, rewrite and recording guidance.
- `SCENE_SCRIPTS.md`: three short complete scenes for the opening, next-stop beat and final reverse beat.
- `HANDOFF.md`: integration and review notes.

## Dialogue inventory
The JSON contains 25 examiner spoken lines, 15 examiner rulebook lines, 25 conductor lines, 50 passenger barks, 20 driving reactions, 15 boarding/alighting lines, 15 ETA/route lines, 15 rain/traffic lines and 10 rare/callback lines.

It also contains 6 control-room lines and 6 market/shop world lines so those requested voices are represented outside the generic passenger pool.

## Record contract
Every dialogue record includes the requested id, speaker, intent, spoken Malayalam, English gloss, emotional delivery, region/casting tag, trigger, priority, cooldown recommendation, exact-subtitle flag and actor/native-rewrite-required flag.

Additional production fields are included for category, `speaker_persona`, subtitle text, suggested timing, interruptibility, recording take and native-review status. `speaker_persona` is the stable casting/bark-selection hint; `speaker` remains the broader in-world role.

`actor_native_rewrite_required = true` means the current words are specifically provisional and must be rewritten or approved by an appropriate native actor before recording. A false value does not remove the overall native-review gate. Every record currently remains `native_review_status = pending`.

When `subtitles_should_match_exactly = true`, update `subtitle_text` to the actual chosen recorded take if an actor changes the words.

## Regional policy
Central Thrissur / Central Kerala is the default voice anchor for the examiner and conductor. Region tags organize casting and performance rhythm. They are not instructions to mechanically respell Malayalam.

North-Malabar and south-Kerala entries are deliberately sparse and conservative. Their marked lines require a performer/reviewer from the relevant regional pool before recording.

Do not imitate district speech from comedy films. The differences should come mainly from real speakers, rhythm, vocabulary and delivery.

## Examiner register split
Normal examiner speech is intentionally short, low-key and deadpan. The rulebook category is the exception: it is intentionally stiff bureaucratic Malayalam and should be performed completely seriously.

Safety overrides the joke. Major crashes, pedestrian danger and genuine loss of control use plain urgent language and must not trigger comic approval.
## Optional licensed media slots
`MOVIE_CLIP_SLOT_01`, `MOVIE_CLIP_SLOT_02` and `MOVIE_CLIP_SLOT_03` are metadata-only insertion points. No film dialogue or copyrighted clip is bundled or transcribed. Gameplay cannot depend on them. Only user-owned or explicitly licensed material should be attached later.

## Integration guidance
Use `trigger` to bind a line to encounter or telemetry state, then respect `priority` before bark frequency. Apply the cooldown as a recommendation, not as a substitute for the EncounterDirector's anti-repetition logic.

Rare/callback lines should be gated by remembered run-state tags and normally fire at most once per run. Do not randomize them into the generic bark pool.

For ambient passengers, prefer conversations and object/route concerns over direct commentary on every player action. Use `speaker_persona` in anti-repetition so three different student lines do not masquerade as three different social voices. Leave quiet stretches between barks so engine, suspension, traffic and weather remain audible.

## Recording gate
1. Native read-through with Central Kerala speakers for the main pool.
2. Separate native review for North-Malabar and south-Kerala tagged lines.
3. Record a faithful take plus a permitted natural rewrite take.
4. Choose the take in context with engine and road noise.
5. Update Malayalam subtitle text to the chosen spoken take.
6. Mark native review complete only after that in-context pass.

## Final QA before integration
Check that dialogue never rewards a serious collision, no normal spoken line has drifted into announcement Malayalam, callback state is available before wiring rare lines, and licensed media slots still work when empty.

The JSON is data-only and can be consumed by a later TypeScript adapter without changing these authored source files.
## V3.1 dialogue polish pass
A second mouth-first audit removed several lines that were grammatical but still sounded written when spoken aloud. Passenger persona is now explicit in the JSON, selected elderly/route/boarding lines were shortened, and the three scene scripts were tightened to the same spoken register as the bark pool. Counts and IDs were preserved.

