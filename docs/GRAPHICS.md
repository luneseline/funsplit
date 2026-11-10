# Gameplay graphics upgrade — v0.3

## Inspection before implementation

The v0.2 source was inspected before changes. No game uses a game-engine canvas. All scenes were combinations of React Native Views, `react-native-svg`, React state and the built-in Animated API.

| Game          | v0.2 rendering/timing                                                                            | Implemented approach                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack Attack  | JS interval every 16ms updated aim and timer state; positioned block Views; Animated drop/offcut | Reanimated frame callback for aim; UI-thread drop/offcut/squash; procedural vector building materials; multi-layer city; landing dust/glow; animated floor counter                                 |
| Tap Tap Broke | Event-updated tap counts; 100ms Animated movement; 50ms timer updated React elapsed state        | Reanimated runner motion, articulated run/win/lose states, checkpoints with crossing pulses, speed streaks, tap-pad ripples and score pops; only whole-second elapsed HUD updates                  |
| Price of Nice | Static image card and inputs                                                                     | Reanimated floating showcase and seal stamp; studio backdrop, local character interaction/win states, lock-in particles and impact sound; identical photos, deck and guess calculation             |
| Snack Flight  | JS interval every 25ms mutated physics refs and forced React redraws                             | Worklet-safe simulation, Reanimated frame callback and shared-value render projection; illustrated food columns, sky/mountains/foreground/cloud layers, air trail, flap squash and crash particles |
| Wheel of Owe  | SVG sectors with one Animated rotation                                                           | Shared-value decelerating rotation; bevelled metallic rim, lights, sector shading, pointer reaction and rate-limited ticks; original sector selection, values and 3.4s duration                    |
| Pocket Money  | JS interval every 25ms mutated balls and forced SVG redraws through React                        | Shared-value simulation/rendering; shaded balls, trails, felt grain, wood rails, pocket depth, cue recoil, impact sparks and reward; identical legal controls and shot equations                   |
| Bullseye Bill | JS interval every 16ms updated aim and remaining time; Animated flight                           | Shared-value aim/crosshair/bow tension/projectile; range depth, target shading, arrow trail, hit particles, screen shake and score pops; same two aim stages, 30s deadline and 650ms flight        |

## Library evaluation

**React Native Skia 2.14 (SDK 58 bundle): evaluated, not installed.** It supports direct shared-value drawing and would be useful for hundreds of particles, atlases, complex shaders or a larger world. These scenes have only a few moving gameplay objects and an existing SVG pipeline. Retaining SVG avoids a second renderer, native surface management and CanvasKit/WebGL setup in the existing web demo. Shading and material grain are vector gradients and reusable geometry rather than per-frame raster assets.

**Reanimated 4.7.1 + Worklets 0.13.0: installed at the versions listed by Expo SDK 58.** Animation values, frame callbacks and animated SVG props run on the native UI runtime. The web implementation uses browser animation frames on its JS thread; this is not a claim that web gains a separate UI thread. React still handles real inputs, scores, result messages, menus and discrete phase changes. Timers for HUD text remain low-rate; they are not the visual animation loop. Callback handles and repeating animations are deactivated/cancelled on unmount.

**Lottie React Native 7.5: used only for a small original native reward burst.** `Reward.native.tsx` selects Lottie on native. The web renderer uses procedural Reanimated particles and a trophy without adding dotLottie/WASM solely for one reward. No optional dotLottie web peer is installed. **Rive: not installed** because there is no authored Rive state-machine asset and the existing vector characters can articulate directly. **Sprite sheets: not added** because scalable original vector characters suit four customizable colours/faces better than shipping raster atlases for every variant. Character states are idle, moving, jumping, interacting, winning and losing, with articulated limbs, blinks and expressions.

Sources: [Reanimated frame callbacks](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/), [animated props](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/animating-styles-and-props/), [Skia animation integration](https://wcandillon.github.io/react-native-skia/v2/docs/animations/animations/), [Skia web setup](https://wcandillon.github.io/react-native-skia/v2/docs/getting-started/web/), [Lottie React Native](https://github.com/lottie-react-native/lottie-react-native).

## Preserving gameplay

The shared session model, bracket logic and room server are unchanged in this upgrade. The new `src/render/physics.ts` functions retain v0.2 constants and update order. `tests/fixtures/v02-physics.ts` contains an independent frozen copy of the original equations. Tests compare flight inputs and **all 460 legal pool angle/power combinations** at the original 25ms nominal simulation step. Pool collision radii, friction, cushion restitution, scratch/pocket rules and near-miss scores match; flight gravity, flap velocity, columns, gap ranges and hitboxes match. Tower sine speed, overlap and perfect thresholds, and archery aim/score formulas are retained. Wheel values remain 10–100, uniformly selected from ten sectors; race remains first to 60 or leader after 20s, with tied-heat sudden death.

Continuous physics uses bounded 25ms canonical steps, with remaining frame time projected into drawing for smoother motion. At most 40ms is accepted per frame after suspension, matching the old simulation's delta cap. Decorative effects never feed positions back into collision/scoring. Screen shake moves a scene container, not the physical world. Cosmetic achievement badges do not change points, unlock gameplay or alter payment history.

## Memory, sound and accessibility

- One active scene frame callback per continuous game; static geometry mounts once per discrete state change.
- Particle bursts have a fixed cap of 16, no unbounded emitter list, and animation cleanup. The pre-existing result confetti is also bounded.
- Procedural SVG materials avoid high-resolution texture downloads. Designer photos retain the pre-existing remote source and retry handling; delivery still depends on external access.
- Six short bundled original effects are synthesized by `scripts/make_fx.py`: tap, impact, reward, whoosh, tick and fail. A root provider keeps one player per cue, rate-limits repeats, reuses players, and pauses them in the background. **SFX ON/OFF** is independent of music mute.
- Reduced-motion preferences suppress idle movement, parallax, limb loops, decorative shake and particle travel. The wheel retains its original result delay but can reveal its final angle without showing the spin. Gameplay-relevant falling/projectile timing is retained.
- No screen reader or touch control has been replaced with a visual-only canvas. The existing accessible game controls and two independent race touch paths remain.

## Review and testing

See [VALIDATION.md](VALIDATION.md) for completed checks and their limits. Native bundle export verifies native imports/worklet compilation, not physical-device playback, native Lottie rendering or a measured native frame rate. No 60fps guarantee is made without device profiling. Browser tests exercise real animated positions, wheel-to-score alignment, live score handoffs, sound playback/mute and simultaneous race contacts.

Capture updated gameplay screenshots against a running web instance:

```sh
node scripts/capture-games.cjs
```

## Gameplay captures

These are screenshots of the running games, not static design replacements. Price of Nice may display the existing retry state when the remote Gucci photo is unavailable.

| Scene         | Capture                                                                |
| ------------- | ---------------------------------------------------------------------- |
| Stack Attack  | [City, materials, falling offcuts](images/graphics/tower.png)          |
| Tap Tap Broke | [Stadium, runners, checkpoints](images/graphics/race.png)              |
| Price of Nice | [Showcase, details and live input](images/graphics/price.png)          |
| Snack Flight  | [Layered food course and moving character](images/graphics/flight.png) |
| Wheel of Owe  | [Shaded sectors, rim and pointer](images/graphics/wheel.png)           |
| Pocket Money  | [Felt, rails, shaded moving balls](images/graphics/pool.png)           |
| Bullseye Bill | [Range, target, crosshair and bow](images/graphics/archery.png)        |

## Final export footprint

The final Expo all-platform export produced a 1.6 MB uncompressed web JavaScript bundle and approximately 3.1 MB Hermes bytecode bundles for each native platform. The six new WAV effects plus original Lottie JSON occupy about 84 KB on disk. This is an explicit bundle-size tradeoff for Reanimated/Worklets/Lottie; Skia/CanvasKit, Rive and the optional dotLottie web player are absent. These sizes are export measurements, not device memory or FPS benchmarks. Lobby character loops are disabled behind active game/setup panels, and static avatar previews do not run limb/blink loops.
