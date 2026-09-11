# Reboot Research Notes

These notes capture external technical/art-direction references used to make the reboot decisions. Re-check versions/licenses before final release.

## Vehicle / animation / lighting

- Rapier `DynamicRayCastVehicleController`: https://rapier.rs/javascript3d/classes/DynamicRayCastVehicleController.html — native wheel suspension, engine force, braking/friction/slip and wheel state support.
- Three.js `AnimationMixer`: https://threejs.org/docs/pages/AnimationMixer.html — per-character animation playback.
- Three.js `AnimationAction`: https://threejs.org/docs/pages/AnimationAction.html — crossfades/weights/time scaling for state-machine blending.
- Three.js PMREMGenerator: https://threejs.org/docs/pages/PMREMGenerator.html — prefiltered environment lighting; docs identify 1K equirectangular input as an ideal size for its normal output.

## Audio

- MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MDN spatialization guide: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
- `PannerNode`: https://developer.mozilla.org/en-US/docs/Web/API/PannerNode — 3D source position/orientation/distance behavior.

## Asset libraries

- Kenney City Kit Roads: https://kenney.nl/assets/city-kit-roads
- Kenney Nature Kit: https://kenney.nl/assets/nature-kit
- Quaternius Universal Animation Library: https://quaternius.itch.io/universal-animation-library
- Quaternius Universal Animation Library 2: https://quaternius.itch.io/universal-animation-library-2
- Quaternius Universal Base Characters: https://quaternius.itch.io/universal-base-characters
- Poly Haven HDRIs: https://polyhaven.com/