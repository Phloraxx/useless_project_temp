# R1 Handling Lab — Build Specification

## Why this exists

R1 is a disposable but rigorous vehicle/camera laboratory. It deliberately excludes the endless world, story, passengers and final bus art so we cannot confuse presentation quality with driving quality.

## Scene

One looping 400–600 m greybox road containing:
- 100+ m straight acceleration/braking section;
- medium sweeping bend;
- tighter 90° junction/turn;
- one narrow gate/bridge-width section;
- one speed breaker;
- one rough/broken patch;
- one wet-grip zone;
- one laterite shoulder excursion area;
- emergency-stop distance markers.

Use plain materials with surface colors only for debugging.

## Vehicle visual

Simple bus-proportioned chassis box, visible four wheels and suspension markers. No hero-bus mesh until R1 passes.
## Tuning panel

Live controls grouped by responsibility:

**Chassis:** mass, center-of-mass offset, linear/angular damping.

**Wheel geometry:** wheelbase/track/radius, suspension connection points.

**Suspension:** rest length, stiffness, compression damping, rebound damping, max travel, max force.

**Tire:** friction slip/grip by surface, lateral assist if used.

**Power:** engine-force curve, max forward/reverse speed proxy, brake force.

**Steering:** max low-speed angle, high-speed angle, input rise/fall, steering return rate.

**Assist:** anti-roll, yaw damping, heading stabilization, traction limiter.

**Camera:** boom length/height, spring frequency/damping, look-ahead, speed FOV, corner anticipation, shake gains.

Every useful configuration can be saved as a named JSON preset with build timestamp.
## Evaluation protocol

For each serious preset, run the same route and record:
- 0→40 km/h time;
- 40→0 braking distance;
- max stable speed on sweeping bend;
- steering correction count through narrow gate;
- roll/pitch peaks;
- suspension compression peaks at speed breaker;
- wet-zone stopping/turning difference;
- shoulder recovery behavior;
- camera max angular/positional lag.

Then perform a blind-feel test: hide telemetry and drive for 3–5 minutes. Record only `too twitchy / too floaty / too stiff / too slow / too unstable / enjoyable` plus notes.

R1 should converge on 2–3 presets, then one winner. Do not tune by changing ten variables between runs.

## Exit condition

Do not start Bus V2 modeling integration until the chosen preset passes desktop and touch tests and the camera remains comfortable during emergency braking, rough road and maximum intended corner speed.