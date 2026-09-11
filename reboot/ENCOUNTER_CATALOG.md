# Encounter Catalogue

Encounters are authored state machines embedded in the continuous route. They may reuse world chunks but must vary setup, dialogue and traffic context.

## Encounter schema

Each encounter defines:
- allowed chunk tags and minimum road geometry;
- anticipation/telegraph distance;
- involved entities and spawn sockets;
- safe/correct real-world fallback;
- fictional examiner preference;
- scoring windows and hard safety rules;
- Flow/Approval deltas;
- examiner performance pool;
- conductor/passenger reaction pool;
- cinematic shot options;
- cooldown and incompatibilities;
- showcase-seed variant.

The examiner can satirically disapprove of safe/textbook choices, but the encounter must never require impact with a person/vehicle or loss of control to succeed.
## Core encounter bank

1. **Textbook Stop** — passengers wait at a marked stop. Exact alignment triggers examiner suspicion; controlled overshoot earns fictional aptitude while excessive overshoot fails the encounter.
2. **Next Stop Request** — passenger asks conversationally; the challenge is remembering/reading the upcoming stop while the examiner evaluates confidence/timing.
3. **Auto in Lane** — slow/parked auto blocks progress. Contextual short horn bursts persuade it aside; ramming is a major fail.
4. **Indecisive Side-Road Car** — vehicle noses out then hesitates. Player chooses assertive but controlled commitment versus repeated stop-go hesitation.
5. **Narrow Bridge** — maintain line and speed without clipping parapet; examiner may mock over-cautious crawling.
6. **Market Merge** — dense authored traffic and pedestrians with a clear safe gap. Score commitment/timing, not reckless impact.
7. **Roadworks Chicane** — cones/barriers and rough surface; tests bus placement and suspension control.
8. **Speed Breaker** — visible hump; passenger comfort/body reaction becomes feedback. Too fast costs mood/approval.
9. **Monsoon Burst** — rain intensity rises, wipers become relevant, wet grip changes and visibility falls.
10. **Conductor Bell/Cue** — conductor signals a short contextual instruction while player is driving.
11. **Edge Forward / Back** — conductor asks for a tiny positioning adjustment at a crowded stop; tests low-speed control.
12. **Slow Boarding** — older passenger or luggage delays departure while traffic stacks behind; examiner/conductor reactions create pressure without forcing unsafe movement.
13. **Student Group** — noisy group boards together, changing interior ambience and producing later reaction/bark opportunities.
14. **`Ivde mathi` Request** — passenger casually requests a sensible nearby drop; timing and local conversational cue matter.
15. **Luggage Loading** — brief door-side staging with conductor/passenger animation; tests patience and restart smoothness.
16. **Impossible ETA** — conductor/passenger asks when they will arrive; return of the `വരും` philosophy as a contextual bark/score beat rather than a modal quiz.
17. **Tea-Shop Gossip** — near-stop ambient conversation can become a short character beat if player dwells.
18. **Rough Road Smoothness** — sustained broken surface; score minimizing vertical/jerk impulses while maintaining progress.
19. **Queue / Horn Communication** — several vehicles block lane; horn pattern/timing and patience determine movement.
20. **Quiet Evaluation Stretch** — no overt challenge; examiner silently watches smoothness, lane placement and unnecessary control inputs.

## Difficulty escalation

Distance increases encounter overlap, not only speed. Later runs can combine rain + stop request + dense traffic or rough road + passenger standing load. Never stack combinations that make cues unreadable.