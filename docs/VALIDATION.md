# Validation — v0.3 graphics upgrade

Checked in the managed Linux environment on 10 November 2026, using Node 24 and Chromium.

- Strict TypeScript checking: `npm run typecheck`.
- **12 Node tests:** existing match/bracket/room checks plus a frozen v0.2 physics oracle. All **460 legal billiards angle/power combinations** match the old state updates, collision outcomes and final scores at the 25ms canonical step. Flight inputs, gate wrap/scoring, collision edges, tower aim/overlap and archery aim/points are also checked.
- **15 Playwright tests:** the seven existing flow tests plus a separate live-graphics test for every game and an effects-audio test. These inspect moving block/ball/crosshair coordinates, tower drop locking and scored landing, sealed price guesses, flight flap/crash, wheel sector-to-score alignment, race running/winning/losing states and the 60-tap finish, arrow release/impact, and actual effects playback/mute. The existing suite covers two simultaneous race touch contacts, a 30-second archery expiry, payment persistence, connected-room rules, menus and music.
- Production export is checked for **web, iOS and Android** through Expo's platform export. Native exports produce Hermes bytecode and include the native reward/Lottie module; they do not constitute an Xcode/Gradle build or a physical-device test.
- Updated gameplay screenshots are reviewed in `docs/images/graphics/`. Visual review caught and corrected an archery stacking-order issue which DOM movement tests alone did not detect; a regression assertion now checks the positioned art layer.
- `git diff` confirms the shared session model, bracket implementation and room server are unchanged by this graphics upgrade.

## Scope of evidence

The web tests exercise browser animation/pointer paths, not native UI-thread scheduling or physical multi-touch. Real iOS/Android testing remains necessary for native frame time, memory, haptic feel, audio latency/interruption and Lottie playback. The upgrade is designed to avoid React render loops, but no measured native 60fps claim is made. Expo SDK 58's bundled Reanimated/Worklets/Lottie versions are used.

Product photos retain the existing official remote URLs. This environment restricts their delivery, so screenshots can show the explicit retry UI. Their presence online is not asserted by the graphics tests. The product deck and dated price sources are unchanged. Screens-down remains an honesty/proxy demo, pool physics remain simplified, and no public multiplayer backend is deployed.

## Reproduce

```sh
npm ci
npm run typecheck
npm test
npm run test:e2e
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo export --platform all --output-dir .native-check --max-workers 2
```

Playwright uses `/usr/bin/chromium` unless `CHROMIUM_PATH` is set. The managed environment additionally redirects Expo's own cache into the workspace. Start `npm run web` before running `node scripts/capture-games.cjs` to refresh the eight gameplay screenshot artifacts.

## v0.3.1 hotfix — 11 November 2026

Fixed the native Worklets `invalidTransform` failure by routing SVG affine transforms to the native `matrix` prop instead of the React Native/CSS `transform` parser. Web uses equivalent SVG matrix strings. Fifteen Node tests pass, including three new tests for pivot geometry, native prop routing and web/native matrix equivalence. Five affected race, archery and pool browser checks pass, strict TypeScript checking passes, and Expo all-platform export completes for iOS, Android and web. These checks do not replace a fresh Expo Go test on the reporting phone. No vendor code, dependency versions, gameplay rules or scoring were changed.

## v0.4 gameplay update — 11 November 2026

- Strict TypeScript checking passes with no new dependencies.
- **22 Node tests** cover the previous model, physics, SVG and room behaviour plus price freshness and exhaustion, one-doom deck invariants for 2–8 players, atomic shared scores, topic freshness, absolute-deadline timer arithmetic and a two-contact native race batch with touch-ID deduplication. The Socket.IO test verifies guests cannot submit shared rounds or bypass them with individual scores.
- **17 Playwright tests** pass at desktop and 390×844 phone sizes. New coverage exercises the once-per-launch intro, a complete two-player Yapathon manual-callout round without microphone access, dynamic Wheel names/cards/immediate reveals, one-safe plus one-doom results, simultaneous race contacts and redesigned Snack Flight motion.
- The timer uses an absolute wall-clock deadline and recalculates on AppState activation. Physical-device background suspension, native haptics, native multi-touch and frame pacing still require device testing.
- The price bank uses dated source links. Retail prices and third-party pages can change and need editorial review before a store release.

## v0.4.1 native colour correction — 11 November 2026

The race checkpoint previously constructed an animated RGBA string. Near zero, JavaScript serialized its alpha in scientific notation, such as `rgba(233,240,86,1.55e-8)`, which native Reanimated rejects. The checkpoint now uses the fixed `#E9F056` colour and a separately clamped numeric opacity. A regression test exercises the reported near-zero value and asserts that no RGBA string is produced. All **23 Node tests**, the focused race/launch browser checks, strict TypeScript checking, and web/iOS/Android Expo exports pass. The launch animation was also expanded while remaining a 2.4-second, reduced-motion-aware cold-launch overlay.
