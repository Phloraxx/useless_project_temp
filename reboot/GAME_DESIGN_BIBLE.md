# Game Design Bible — Endless Qualification Run

## Player fantasy

You are a candidate driver trying to satisfy an examiner whose standards are confident, precise and fundamentally useless.

This is a **score-attack driving comedy with a living bus interior**. The driving must remain fun after every scripted joke is known.

## Three simultaneous games

1. Keep a heavy bus under control.
2. Read the examiner's absurd standards and maintain approval/Flow.
3. Manage a social space: passengers, conductor, stops, traffic and reactions.

## Primary resources

- **Score / Natural Aptitude** — unlimited run score.
- **Flow** — multiplier built by smooth committed driving and successful encounters.
- **Examiner Approval** — health-like meter reduced by failed reads and overly textbook behaviour.
- **Passenger Mood** — changes barks/reactions; not a direct fail bar.
- **Distance** — run progression/difficulty input.

No currency/economy in the first release.

## Failure model

**Grading interruption:** exact stop, unnecessary hesitation, refusing a contextual horn cue, over-precise ETA, timid authored merge, missed conductor cue.

**Major penalty:** scenery scrape, excessive off-road time, repeated failed encounter, huge stop error.

**Run end:** pedestrian impact, hard collision above threshold, overturn/unrecoverable bus, or examiner approval reaches zero.
## Moment-to-moment driving loop

The road should produce a meaningful decision every 10–25 seconds, but not every decision is a joke. Quiet driving is required so speed, suspension, ambience and passenger life have room to breathe.

Typical cadence:

`quiet road → social/traffic cue → anticipation → player commits → reaction → optional grading shot → recovery → quiet road`

The player must never feel like they are clicking through comedy cards. The bus remains controllable for most of the run.

## Flow system

Flow is the arcade heartbeat of the run. It begins at `x1` and can climb toward `x8` through consecutive clean encounter reads, committed driving and smooth recovery.

Flow rises for:
- successful contextual horn communication;
- controlled but assertive merges;
- hitting the examiner's absurd stop-placement window;
- responding to conductor/passenger cues without hesitation;
- keeping the bus stable through rough road and corners;
- maintaining progress without serious impacts.

Flow breaks or falls for hard collisions, repeated indecision, getting stuck, major off-road excursions or explicit encounter failure.
## Examiner Approval

Examiner Approval is not morality and not passenger safety. It represents whether the candidate is satisfying this fictional examiner's bizarre doctrine.

Approval changes should be readable through acting before the UI confirms them: glance, pencil movement, head shake, tiny nod, clipboard mark, sigh.

Approval should rarely jump by large amounts. The examiner becomes funnier when reactions are restrained.

## Passenger mood

Passenger mood is a hidden aggregate plus optional per-passenger state. It controls bark frequency, complaints, laughter, bracing intensity and whether small conversations trigger.

Passengers are not a second scoring judge. They can disagree with the examiner. That conflict is a major comedy source.

Example: the examiner approves a ridiculous overshoot while one passenger mutters about having to walk back.

## Encounter fairness

Every encounter must telegraph its context before scoring begins. The player should lose because they made a readable choice, not because a hidden trigger fired.

Each encounter definition needs: anticipation cue, scoring window, safe fallback, examiner response, passenger response pool, cooldown and deterministic showcase variant.