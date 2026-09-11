# Casting Bible - Dialogue V3

## Core rule
Cast people who can speak naturally, not people who can merely read Malayalam cleanly. The spoken world should sound like a bus ride heard from two seats away. If a line sounds written when spoken aloud, rewrite it before recording.

Every final take needs a native-speaker review. `actor_native_rewrite_required = false` means the draft is usable as a starting point, not that review can be skipped.

## Performance baseline
- Keep most lines between one and six seconds.
- Do not announce the joke.
- Fragments, overlaps, swallowed subjects and ordinary code-switching are welcome.
- Do not force dialect through comedy spelling.
- Subtitles normally match the recorded line exactly.
- Background characters should often sound occupied with their own problem, not with the player.
- Silence, looks, breath and timing can replace dialogue.

## Examiner
Default casting: Central Kerala, preferably Thrissur-area natural speech. Age can read as experienced professional rather than elderly authority figure.

Register A is normal speech. Use short phrases, low volume and very little emotional decoration. The examiner is funniest when he sounds certain and slightly busy. He does not wink at the player.

Register B is rulebook speech. This is deliberately formal Malayalam, read as if the wording is completely routine. Do not perform it like a comedy sketch. The contrast with his normal voice creates the joke.

Physical rhythm: look first, pencil movement second, line third. A two-second pause can be more valuable than another sentence.

## Conductor
The conductor is quicker, louder when needed, and practical. Cast someone comfortable projecting over engine and crowd noise without sounding theatrical. Central Kerala is the default pool, but the voice should not simply duplicate the examiner.

Conductor lines are cues first: boarding, bell, road edge, horn, gap, luggage, door and passenger movement. Let the actor overlap naturally with bus noise and passenger speech.

## Passenger pools
`Speaker_persona` is the casting and bark-selection key. Do not treat every record with `speaker = passenger` as interchangeable. A student, older regular, office commuter, parent and elderly rider should differ in rhythm, attention and what they notice, even when two lines share the same gameplay trigger.

**Older regular:** familiar with every bend and informal drop point. Calm confidence, not a village-comedy stereotype. Can correct route knowledge without making a speech.

**College students:** talk to each other first. Light code-switching is natural. Avoid writing every line around memes, reels or slang. Their energy should come from interruption and friendship.

**Office commuter:** clipped phone speech, mild time pressure, often half-focused on the bus. English work words can appear naturally when the situation calls for them.

**Parent:** practical attention split between child, bags and stop timing. Concern should stay grounded unless the driving genuinely becomes unsafe.

**Elderly passenger:** allow extra breath and time. Do not make age itself the joke. Requests can be soft but should remain audible in the mix.

**Shopper / luggage passenger:** lines should be about physical objects, space and getting on or off. These are useful for making vehicle motion matter socially.

**Visitor / route asker:** uncertainty is enough. Do not make unfamiliarity with the route equal stupidity.

## Regional casting
`central-thrissur` and `central-kochi-ernakulam` are practical casting pools, not text filters. Preserve natural rhythm in performance instead of respelling every vowel.

`north-malabar` and `south` lines are intentionally conservative drafts. A performer from the relevant speech community must rewrite or approve them before recording. Do not manufacture a district accent from film imitation.

A regional voice can use its own natural vocabulary if the meaning, timing and gameplay trigger remain intact. Update the subtitle to the recorded take.

## Control-room caller
Sound like a real operational call: compressed, slightly distracted, no exposition. The caller may know road conditions but should not narrate gameplay systems.

## Market and shop voices
Record these as positional world audio, preferably with several speakers and distance variants. Vendors should sound like they are addressing actual nearby customers, not the player camera.

## Recording workflow
1. Give the actor the intent, trigger and English gloss before the Malayalam draft.
2. Ask for one faithful take and one natural rewrite take.
3. Keep the rewrite if it sounds more like something the actor would actually say and preserves gameplay meaning.
4. Record reactions at multiple intensities where useful, especially braking, cornering and traffic.
5. Test every important line against diesel, road, horn and cabin noise before approving length.
6. Mark the chosen take in data and replace the subtitle with the exact recorded wording.
7. No line is final while `native_review_status` is `pending`.

## Code-switching
Use English only where the character would naturally use it: `meeting`, `join`, `right`, `door clear`, `network`, `reverse`, `damage`, and similar everyday operational or work words. Do not add English just to make dialogue look modern.

## Safety register
When a major collision, pedestrian risk or genuine loss of control occurs, comedy drops away. Examiner and conductor delivery becomes immediate and plain. Never perform a dangerous event as if it earned a clever qualification mark.

## Licensed clip slots
`MOVIE_CLIP_SLOT_01` through `MOVIE_CLIP_SLOT_03` are optional integration points only. No copyrighted film dialogue is bundled or transcribed. A clip may be inserted only when the user owns it or has explicit permission to use it, and gameplay must remain fully functional when the slot is empty.

## Red flags in a recording session
Reject takes that sound like news reading, school recitation, stage comedy, exaggerated Thrissur parody, generic movie-Malayalam, or an actor visibly waiting for the punchline. Reject passenger sessions where every persona lands on the same rhythm or attitude. Also reject a take if the actor says the sentence would never come out that way in ordinary conversation. Rewrite it on the spot.
