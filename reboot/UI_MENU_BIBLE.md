# Menu + HUD Bible

## Menu concept

The menu is a depot/exam-office scene rendered in the same world, not a web-dashboard panel laid over an empty background.

Camera slowly frames the parked hero bus, depot board and examiner desk/clipboard area. Ambient depot audio already plays.

Primary options:
- `പരീക്ഷ തുടങ്ങാം`
- High Scores
- Settings
- Controls
- Credits

Candidate name can be entered once in a small application slip/clipboard interaction, then persisted locally.

## Visual language

Use institutional paper/clipboard/stamp typography only for menus and grading overlays. Avoid huge opaque cards covering the entire game. Most UI should occupy edges or exist diegetically in the examiner's clipboard/camera shot.

Malayalam typography must be locally bundled/offline-safe.
## In-run HUD

Default HUD is deliberately sparse:
- speed;
- score;
- Flow multiplier;
- examiner approval indicator;
- short encounter cue only when needed.

Do not permanently show five comedy metrics. Detailed telemetry belongs in debug mode and run summary.

Flow feedback can use subtle typography, audio sting and edge treatment rather than a giant combo meter. Approval should preferably be expressed by examiner behavior first and a small UI meter second.

## Cinematic grading UI

During an examiner shot, grading marks can appear as handwriting/stamp-style overlays near the clipboard, then resolve to a tiny `+score / approval` delta. Never pause the scene to read multiple paragraphs.

## Run end

Show distance, score, max Flow, approval, notable incident tags and local rank/best. The certificate idea may return as an optional share/print artifact after the game itself feels complete, not as a core dependency.