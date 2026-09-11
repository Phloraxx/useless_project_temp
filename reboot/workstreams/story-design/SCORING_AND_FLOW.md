# Scoring and Flow V3

## Design goal

Scoring must reward **good bus control plus successful reading of the fictional institution**, without teaching the player that unsafe driving is clever. The player should be able to understand a run through three concepts: Natural Aptitude score, Flow multiplier, and Examiner Approval. Safety sits above all three as a hard gate.

## 1. Natural Aptitude — lifetime run score

Natural Aptitude is the visible score and can grow indefinitely. It answers: “How well are you performing this strange qualification while keeping the service moving?”

Points come from four sources:
- **Control:** smooth braking, stable cornering, rough-road management, clean stop placement, recovery.
- **Read:** interpreting a telegraphed encounter correctly.
- **Service:** useful boarding/alighting placement, responding to conductor/passenger cues, maintaining progress without compromising safety.
- **Institutional instinct:** harmless choices that match the examiner’s fictional preference, including practical rather than ceremonial precision.

A normal successful encounter should award enough base points to feel meaningful before multiplier. Pure driving stretches can drip smaller control points so silence is never score-dead.

## 2. Flow — short-term mastery multiplier

Flow is the arcade heartbeat. Start at x1.0 and rise through consecutive clean decisions toward a cap around x8.0. Do not make it a fragile rhythm-game combo that breaks on every tiny error.

Flow rises fastest for:
- cleanly resolving encounters without unnecessary control reversals;
- smooth braking/acceleration transitions;
- maintaining useful momentum through readable traffic;
- handling modifiers such as rain/roughness without destabilizing the bus;
- successful conductor shorthand / stop reads later in a run.

Flow decays gently during long inactivity and drops sharply for collisions, severe jerk, getting stuck, repeated indecision, or major encounter failure. A minor grading disagreement should shave Flow, not always reset it.

Flow should be felt through engine/cabin rhythm, restrained UI treatment and examiner/conductor confidence—not only a number.

## 3. Examiner Approval — qualification health

Approval represents whether this examiner believes the candidate has the required fictional instinct. It is not passenger happiness, legality, morality or safety.

Approval changes slowly. A single exact textbook stop should never make the player feel half-dead. Small corrections are usually ±1–4% equivalents; major repeated failures may cost more.

Approval rises for repeated evidence of safe, confident route reading and can gain a small “trust buffer” after novel solutions. It falls for over-hesitation, missed readable cues, wildly impractical stop placement, and repeated failure to progress when safe opportunities are obvious.## 4. Safety gate — non-negotiable layer

Safety overrides all comedy scoring. Severe pedestrian impact, major collision, rollover or unrecoverable loss of control ends the run. Near-misses caused by reckless speed should not be reframed as “confidence.”

Encounters can prefer **assertiveness inside a safe envelope**, never aggression outside it. The scoring system should evaluate collision margin, speed, bus stability and vulnerable-road-user conflict before awarding an examiner-style bonus.

If a fictional-preference condition and a safety condition conflict, safety wins and the examiner either approves the safe action or remains silent. Never generate a joke that implies the player should have endangered someone.

## 5. Passenger mood — hidden response state

Passenger mood is not a fourth score bar. It influences reactions, chatter, willingness to joke, bracing, complaints and atmosphere.

Mood can improve through smooth driving, considerate waits and useful stops. It can worsen through jerk, repeated missed stops, excessive horn use, rough surface abuse or long delays. Passengers may dislike a maneuver the examiner loved, creating comedy without directly punishing the score twice.

## Scoring relationship

Think of the run as:

**Safety decides whether the action is eligible.**  
**Base execution decides the points.**  
**Flow multiplies those points.**  
**Examiner Approval tracks qualification confidence over time.**  
**Passenger mood changes the social reaction.**

This prevents one absurd grading rule from controlling every system.

## “Correct driving mistake” scoring

A perfectly safe but excessively formal action can receive:
- full Control points;
- reduced Institutional Instinct points;
- a small Approval loss;
- mild Flow shave if it materially disrupts rhythm;
- no safety penalty.

Example: stopping exactly on a painted marker when a safe practical door position two metres forward would serve the waiting group better. The player still drove safely, so they retain control credit. The examiner merely finds the choice suspiciously textbook.

A safe practical alternative can receive full Control + Service + Instinct points and preserve/build Flow.

A genuinely unsafe alternative receives no Instinct bonus regardless of examiner archetype.## Suggested event weights

Use relative weights rather than locking values during narrative design:
- micro control success: 0.25 unit;
- common encounter: 1 unit;
- uncommon combination: 1.5–2 units;
- rare/story solution: 2–3 units;
- clean recovery after a mistake: up to 1 unit;
- quiet-stretch excellence: periodic 0.25–0.5 units;
- major collision: run end or overwhelming penalty, never farmable.

The multiplier applies mainly to positive earned score. Do not multiply safety penalties by x8; punishment should be readable and proportional rather than catastrophically opaque.

## Flow tiers as performance language

- **x1–x2: Settling In** — examiner watches; conductor gives explicit cues.
- **x2–x4: In Rhythm** — cue windows feel natural; small positive audio/UI reinforcement.
- **x4–x6: Route Sense** — conductor uses shorthand; examiner reacts before writing.
- **x6–x8: Natural Aptitude** — long clean chain; sparse presentation, because the driving itself should feel satisfying.

Do not literally display these English labels during play unless UI testing proves useful. They are narrative/performance direction.

## Recovery is part of mastery

A player who brakes slightly late but recovers smoothly should not feel the run is ruined. Award limited recovery credit when they stabilize without collision, passenger danger or repeated oscillation.

This supports replayable driving feel: perfect runs are aspirational, but imperfect runs can become stories.

## Result logic

Certificate classification should use four gates in order:
1. **Safety:** any disqualifying event blocks endorsement.
2. **Completion:** player reached an eligible result checkpoint or voluntarily ended at one.
3. **Approval:** enough examiner confidence remains for endorsement/provisional status.
4. **Aptitude:** score, max Flow and incident quality determine classification flavor/rank.

A very high score cannot erase a severe safety event. A very safe but extremely hesitant player may finish with a provisional/textbook-tendency result rather than a joke “failure for being safe.”

## Result memory

Persist for the summary: highest Flow, total Aptitude, distance, safety status, 2–3 strongest positive incident tags, 1 strongest correction tag, one passenger-mood descriptor, and whether the player accepted the first certificate checkpoint or continued.

Those tags drive examiner summary lines and make two similar scores feel like different runs.