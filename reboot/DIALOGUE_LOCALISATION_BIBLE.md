# Dialogue + Malayalam Localisation Bible

## Rule zero

Do not translate English jokes into Malayalam. Write spoken intent directly for a character, relationship and situation.

The previous prototype overused print/formal Malayalam. V2 separates two registers deliberately:
- **spoken world:** colloquial, short, contracted, code-switching where natural;
- **institutional layer:** intentionally stiff/formal language on clipboard/forms/rules.

The contrast is part of the comedy.

## Dialogue record schema

Every line stores:
- `id`;
- speaker/persona;
- situation/intent;
- district/register tag;
- spoken Malayalam draft;
- subtitle text;
- optional English internal gloss;
- emotional intensity;
- timing/pause;
- interruptibility;
- recording take/version;
- native-review status.

No line reaches final voice recording with `native-review status = unreviewed`.
## Cast language plan

Anchor the examiner in a natural Central-Kerala/Thrissur-area speaking voice, but avoid exaggerated cinema parody. The conductor may have a different nearby register. Passenger pools should eventually include Central/Ernakulam, Malabar/North and South-Kerala voices with actual speakers/reviewers.

Region is primarily voice rhythm, vocabulary choice and performance. Do not force dialect identity through intentionally misspelled subtitles.

## Writing process

1. Write the scene intention in plain language.
2. Write one short spoken Malayalam draft.
3. Read it aloud at normal conversation speed.
4. Remove anything that sounds like an announcement or textbook unless the character is intentionally formal.
5. Give it to a native reviewer/actor with permission to rewrite.
6. Record at least two natural takes.
7. Subtitle what was actually said.
8. Test in the scene with engine/road noise and shorten again if needed.

Most lines should be 1–6 seconds. Background barks can be fragments. Silence is allowed.
## Character voice rules

**Examiner:** fewer words than everyone else. Often responds with a look first. Can use bizarrely formal phrases only when quoting the fictional rulebook. Never explains the joke.

**Conductor:** practical commands and observations. Can overlap with passenger noise. More likely to call out direction/position than to deliver punchlines.

**Passengers:** talk to each other as much as to the driver. Reactions should include indifference, irritation, amusement and ordinary chatter, not a chorus of jokes.

## Placeholder examples — NOT final dialect copy

Intent: examiner thinks a textbook-perfect stop is suspicious. Prefer something as short as `ഇത്ര കൃത്യമായി വേണ്ട.` over a paragraph explaining why.

Intent: examiner approves recovery. Prefer `ആ. ഇങ്ങനെ.` / `പോ, പോ.` style brevity if native review finds it natural for that persona.

Intent: passenger stop request. Keep conversational vocative and destination cue; actor may naturally compress it.

Intent: examiner after passenger says stop was missed. Preserve the deadpan one-beat acknowledgment, but let the final performer choose the natural exact wording.

Do not freeze these examples as final script. They are direction, not approved dialogue.
## Dialect research correction

Do not model Kerala speech as exactly four clean accents. Published linguistic work describes Malayalam as diglossic and colloquial forms as varying by region **and** social community; older survey work identifies many overlapping dialect/sub-dialect areas. Research has also demonstrated acoustic distinction between Thrissur and Kozhikode corpora.

Therefore `regionTag` is a casting/organization hint, not a deterministic text transformer.

Initial practical casting pools may be labeled `central-thrissur`, `central-kochi-ernakulam`, `north-malabar` and `south`, but actors/reviewers decide natural wording. Community-specific speech should only be used when a reviewer/performer from that community is intentionally involved; never infer it from clothing or character appearance.

Reference: Namboodiripad & Garellek, *Malayalam (Namboodiri Dialect)*, JIPA 2017; Prabhakaran et al., Malayalam dialect recognition using Thrissur/Kozhikode corpora, Procedia Technology 2016.