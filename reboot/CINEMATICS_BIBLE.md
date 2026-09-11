# Cinematics Bible — Real-Time Grading

## Purpose

Cinematics are punctuation, not a separate movie mode. They reveal character, clarify why the examiner reacted, and let a physical joke land before returning control.

## Trigger safety

A grading cinematic may begin only when the game can create a deterministic safe state:
- bus below a speed threshold;
- bus constrained/held in lane or at stop;
- surrounding encounter agents temporarily stabilized;
- no unresolved collision or pedestrian path conflict.

If safety conditions are not met, queue the grading reaction and deliver it later through voice/clipboard micro-animation without freezing gameplay.

## Time scale

Preferred: 0.35–0.7× slow-down for the transition, then hold/safe pause only when necessary. Avoid abrupt full freezes during high-speed motion.

Typical interruption target: 2–6 seconds. Major disqualification can be longer.
## Shot library

Keep reusable authored shot types with per-encounter anchors:
- `CHASE_DEFAULT`;
- `CHASE_TIGHT`;
- `SIDE_STOP_MEASURE`;
- `FRONT_3Q_BUS`;
- `LOW_WHEEL_SUSPENSION`;
- `INTERIOR_EXAMINER_MEDIUM`;
- `INTERIOR_EXAMINER_CLOSE`;
- `INTERIOR_DRIVER_EXAMINER_TWO_SHOT`;
- `INTERIOR_PASSENGER`;
- `INTERIOR_CONDUCTOR`;
- `DOOR_BOARDING`;
- `MIRROR_LOOK`;
- `ROAD_REVEAL`;
- `MONSOON_REVEAL`;
- `RUN_END_WIDE`.

Each chunk/encounter may expose camera anchors, but the director owns blending, collision checks, target selection and return-to-gameplay framing.
## Grading sequence template

1. Detect scored event and capture telemetry snapshot.
2. If safe, ease time scale down and reduce player input authority.
3. Cut to evidence shot if the mistake needs visual explanation.
4. Cut to examiner reaction/clipboard.
5. Play one concise line or silent reaction.
6. Show tiny score/approval delta only after performance lands.
7. Return to a chase composition that points the player toward the next road action.
8. Restore input/time smoothly.

The player should understand the examiner's judgement without reading a paragraph.

## Micro-cinematics without cuts

Use mirror glances, examiner head turns, clipboard marks, conductor gestures and passenger looks during normal chase gameplay. Most grading should be delivered this way; hard camera cuts are reserved for strong beats.

## Showcase seed

The judge/demo seed must guarantee a polished sequence of 3–4 strong encounters within two minutes while still looking like continuous gameplay. It uses the same systems as endless mode, not a separate scripted video.