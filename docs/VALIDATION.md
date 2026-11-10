# Validation

Verified in the managed Linux environment on 2026-11-10 using Node 24 and Chromium:

- Strict TypeScript check (`npm run typecheck`).
- Eight passing Node tests (`npm test`): score/turn validation, rank normalization, ties, mixed/repeated rounds, every bracket size from 2–8 (including odd byes), rejecting tied heats, atomic full-roster race results, and a real two-socket room lifecycle. The room test checks host-only brackets, rejecting individual race scores, malformed and duplicate bracket submissions, round advancement and disconnect reset.
- Seven passing Playwright checks (`npm run test:e2e`): complete price-to-payment flow and saved history, phone layout and arenas, decision shortlist and honesty-mode check-ins, every non-price single-player game finishing and handing off, a full same-screen race with **two simultaneous CDP touch contacts**, horizontal/vertical archery aiming plus a 30-second expiry, and actual bundled audio playback / pause on mute. The audio assertion checks media playback and advancing playback time, not just the toggle label.
- Production web export with the bundled WAV asset (`npm run build -- --max-workers 2`).
- Screenshots inspected for arcade, race, archery and tower. Race tap pads fit in a 390 × 667 viewport. No page errors in the payment flow or simultaneous-touch race test.

Native iOS/Android builds, native touch hardware/haptic feel, audio interruptions and device lifecycle on physical phones still need testing. CDP touch testing exercises the web pointer path; the native shared-screen pads use passive touch-start events and need real-device verification. Product names, style IDs and US prices were checked against official Gucci pages; external product-photo delivery could not be verified from this environment’s restricted network. The app has an explicit photo-load error/retry state. Price snapshots and photo provenance are documented in [ASSETS.md](ASSETS.md).

No public multiplayer server is deployed. The room tests use localhost; the server trusts host/client gameplay scores. Screens-down remains a clearly labelled proxy/manual demo. Pool physics are simplified.
