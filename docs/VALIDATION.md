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

Playwright uses `/usr/bin/chromium` unless `CHROMIUM_PATH` is set. The managed environment additionally redirects Expo's own cache into the workspace. Start `npm run web` before running `node scripts/capture-games.cjs` to refresh the seven screenshot artifacts.
