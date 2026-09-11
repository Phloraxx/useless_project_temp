# Physics + Camera Bible

## Driving target

The bus should feel heavy, readable and playful rather than simulator-accurate. It must communicate weight through suspension, braking distance, body motion, audio and camera while still responding quickly enough for an arcade score-attack game.

The old kinematic controller is not reused.

## Vehicle architecture

Use a dynamic rigid chassis with Rapier's ray-cast vehicle controller. Each wheel owns suspension direction/rest length/travel, steering angle, engine force, braking, friction slip and contact state.

Visual bus body, wheels and suspension are children driven from physics state; gameplay is not derived from the visual mesh.

Initial physical envelope for tuning, not final truth:
- simulated effective mass: start around 10,000–14,000 kg and tune;
- wheelbase: start around 5.2–5.6 m;
- overall width reference: about 2.5–2.6 m, with wheel track tuned to the chassis;
- four raycast wheels;
- rear-biased drive force;
- front-wheel steering;
- deliberately low center of mass compared with visual roof height for stability.
## Control shaping

Raw keyboard input must never directly become wheel angle or engine force. Apply input rise/fall smoothing and speed-dependent steering.

Suggested first-pass behavior:
- low speed steering maximum around 28–34°;
- progressively reduce steering above roughly 30 km/h;
- throttle ramps quickly but not instantly;
- brake has a short pressure ramp so tapping differs from panic braking;
- reverse requires near-stop before strong negative drive force;
- optional mild traction/yaw assist prevents absurd spin without removing road feel.

## Suspension / body feel

Expose rest length, stiffness, damping, max travel and max suspension force in a live tuning panel. Visual wheel travel should be visible, but body roll/pitch should come from chassis dynamics plus small presentation offsets, not fake canned animation alone.

Add an anti-roll force pair per axle if required after the base raycast vehicle is stable. Do not compensate for a badly placed center of mass with extreme anti-roll values.

Road surfaces expose grip and roughness metadata. Asphalt, wet asphalt, gravel/laterite shoulder and speed breakers must be distinguishable through tire response, vertical chassis motion and sound.
## Chase camera

Use a critically damped/spring-style camera rig rather than direct `lerp` to a fixed offset.

Camera inputs:
- chassis position and forward vector;
- linear velocity and acceleration;
- yaw rate / steering angle;
- road normal or bus up vector;
- target encounter focus point when appropriate.

Behavior:
- camera pulls slightly back as speed increases;
- FOV widens modestly with speed, never to arcade distortion;
- look target leads velocity so corners are readable;
- gentle lateral anticipation reveals the inside of a turn;
- roll contribution is tiny and heavily damped;
- braking/impact shake is impulse-based and short;
- a collision probe shortens the boom near buildings/trees.

Camera motion must remain comfortable on mobile. Disable or reduce shake in accessibility/settings.
## Handling telemetry

R1 must log at least speed, longitudinal/lateral acceleration, steering input/angle, brake/throttle, yaw rate, chassis roll/pitch, wheel contact, suspension compression, slip proxy and surface type.

A debug overlay should plot live values and provide preset save/load. Tuning decisions should be repeatable rather than remembered by feel alone.

## R1 test course

Greybox only: long straight, increasing-radius bend, tight junction, speed breaker, rough patch, wet patch, laterite shoulder, emergency stop marker and one narrow gate.

No dialogue. No passengers. No cinematic system. Only vehicle, camera, tire/suspension audio placeholders and telemetry.

Pass criteria:
- enjoyable 3–5 minute loop without content;
- stable at intended top speed;
- recoverable from ordinary steering mistakes;
- clear difference between smooth brake and panic brake;
- visible body weight without seasickness;
- camera never clips through bus/world in ordinary driving;
- keyboard and touch produce equivalent intent;
- stable desktop frame rate before hero art is introduced.

## Research implementation note

Rapier exposes wheel friction/slip, suspension travel/force and engine force on `DynamicRayCastVehicleController`; use those native controls before inventing a second tire model. Three.js/WebGL visuals should consume physics telemetry rather than duplicate simulation.

## Full-size bus reference correction — 2026-09-11

Ashok Leyland's current Viking specification lists 5,334/5,639 mm wheelbases, 2,600 mm overall width, roughly 10.9–11.4 m overall length and maximum GVW of 16,200 kg. V2 remains fictional, but R1 should begin in that physical class rather than a shortened 6–9 t approximation.

Do not simply set simulated mass to GVW and call it realistic. Tune mass/inertia/center of mass together so braking, roll and suspension communicate a heavy bus while arcade assists preserve control.
