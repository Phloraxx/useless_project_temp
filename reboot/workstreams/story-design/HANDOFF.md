# Story Design Handoff

Status: V3 narrative proposal for integration with the reboot. This workstream changes no live R1/R2 code or assets.

## Canonical decisions proposed

1. The player already has a legitimate heavy-vehicle licence; the exam is for a fictional **Local Route Instinct Endorsement** required for a relief/standby passenger-service posting.
2. The exam bus becomes a live service because the scheduled driver is absent and the depot merges both allocations for “administrative efficiency.” This explains real passengers organically.
3. The story arc is the examiner relationship, not a sequence of levels: procedure → correction → prediction → surprise → adoption → human leak → result.
4. The conductor is an independent practical authority, not the examiner’s sidekick or tutorial narrator.
5. The first ten minutes are authored ordering inside the same continuous streamer. After minute ten, encounter ordering becomes systemic without a mode-change screen.
6. A certificate checkpoint appears at a safe terminus roughly 15–25 minutes into a healthy run. Player may finish or continue endlessly.
7. The final authored sting remains “വണ്ടി ഒന്ന് പിന്നോട്ട് ഇടാമോ?” as a tiny post-certificate reverse for the examiner’s personal convenience.
8. Safety always outranks parody. No score system may reward collision, pedestrian intimidation or genuinely dangerous commitment.

## Files

- `STORY_V3.md` — premise, cast, examiner arc, major beats, callbacks, failures, certificate and replay reasons.
- `ENCOUNTER_V3.md` — 44 encounter premises: 18 common, 12 uncommon, 8 rare, 6 story-only.
- `RUN_PROGRESSION.md` — authored first ten minutes, endless transition and escalation tiers.
- `SCORING_AND_FLOW.md` — Natural Aptitude, Flow, Approval, passenger mood and hard safety gate.

## What to implement first

For the first narrative vertical slice, do not attempt all 44 encounters. Prove these six in order:
1. depot merged-allocation opening;
2. quiet handling stretch;
3. first perfect-stop grading reveal;
4. slow boarder under traffic pressure;
5. decisive safe side-road/merge;
6. rulebook-gap stop caused by roadworks/puddle.

If these six are not fun, more dialogue will not fix the game.## Requirements for Encounter Director

Every encounter needs semantic setup, telegraph distance/time, a broad safe fallback, optional examiner-preference band, success/failure telemetry, modifier compatibility, cooldown, reaction pools and incident-memory tags.

Do not encode comedy as `if X then show joke`. Emit semantic outcomes such as `SAFE_PRACTICAL_STOP`, `SAFE_TEXTBOOK_STOP`, `HESITANT_SAFE_MERGE`, `SMOOTH_RECOVERY`, then let examiner/dialogue/camera systems choose performance.

Maintain separate histories for chunk family, encounter premise, modifier and strong cinematic reaction so repetition control works across systems.

## Requirements for Examiner performance

Restraint is mandatory. Target distribution for ordinary grading: majority micro-animation only, some one-line voice barks, few camera cuts. The examiner becomes less verbal as player competence rises.

Needed animation vocabulary: watch-road, glance-driver, pen-poised, write, stop-writing, tiny nod, head shake, protect-paper-from-rain, check-time, pen-failure, result-sign, exit-look.

Do not animate broad comedy faces. The world around him can be messy; he stays contained.

## Requirements for Conductor / passengers

Conductor cues must remain gameplay-readable under engine and road noise. Familiarity can shorten wording, but never remove critical information.

Passenger reactions require ordinary states: ignore, continue conversation, look up briefly, brace, complain quietly, laugh once, ask conductor, move toward door, wait, thank someone. Avoid synchronized crowd reactions.

Keep named/personality-tagged passengers aboard across several chunks so callbacks arise from continuity rather than teleporting joke NPCs.

## Requirements for camera

Reserve authored hard cuts for: first textbook-stop reveal, first rulebook gap, rare examiner audit/pen beat if safe, result, major disqualification. Everything else should prefer chase focus shifts, mirror looks and interior micro-shots.

The final reverse gag must return actual control to the player for the tiny maneuver rather than playing as a canned animation.

## Requirements for audio

Do not score jokes with comedy stings. Use diegetic punctuation: pencil stops, stamp, bell, air brake, indicator, rain roof, distant impatient horn, passenger movement, cheap pen click.

The first ten minutes need deliberate quiet pockets so diesel/load, suspension and cabin rattle can carry personality without dialogue.## Ruthless cuts / anti-patterns

Cut any joke that needs a paragraph to explain why it is funny. Cut dialogue quizzes. Cut repeated “examiner likes reckless driving” variants. Cut meme/movie quote dependence. Cut characters who exist only to shout punchlines. Cut fake regional dialect spelling. Cut random event chaos without a readable player decision. Cut any encounter that is indistinguishable with dialogue muted.

Also cut the temptation to make every successful maneuver an examiner moment. The bus, road, conductor and passengers need ownership of the comedy.

## Localisation handoff

All dialogue in these files is intent/gloss, not final Malayalam. The Malayalam workstream should preserve short spoken rhythm, character hierarchy and silence. Examiner lines should usually be the shortest. Institutional certificate/form language may be intentionally formal.

The literal phrase `വണ്ടി ഒന്ന് പിന്നോട്ട് ഇടാമോ?` is retained as a requested final gag candidate; native review may adjust delivery around it, but its plain, practical quality is the point.

## Narrative acceptance tests

A successful vertical slice should pass these questions:
- Is the bus still enjoyable for 60 seconds with all dialogue muted?
- Can a first-time player understand why the first perfect stop was marked strangely without reading a paragraph?
- Does the slow-boarder beat make clear that safety overrides examiner absurdity?
- Does the conductor feel like someone doing a job rather than a hint system?
- Do at least half the passenger reactions consist of ordinary behavior rather than jokes?
- Can the game run three minutes without a camera cut and still feel socially alive?
- Does the rulebook-gap beat visibly change the examiner relationship?
- Does minute ten feel like continued play rather than the end of a scripted tutorial?
- Can the certificate summary cite actual run incidents?
- Is the final two-metre reverse funny even with minimal dialogue?

If several answers are no, do not add more encounters. Fix character performance, telegraphing, driving feel or pacing first.