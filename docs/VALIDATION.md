# Validation

Verified in the managed Linux environment on 2026-11-10 using Node 24 and Chromium:

- TypeScript strict type check (`npm run typecheck`).
- Five passing Node tests (`npm test`): invalid/duplicate turns, rank scoring across mixed games, tie preservation, repeated versus mixed rounds, and a real two-socket room lifecycle including host restrictions, score rejection and disconnect reset.
- Four passing Playwright tests (`npm run test:e2e`): complete two-player price round through payment confirmation and reload persistence; 390px phone layout with no horizontal overflow; all seven game arenas; restaurant shortlist setup and screens-down honesty check-ins; each non-price game finishes and hands off to the next player.
- Production web bundle exported successfully (`npm run build`).
- Desktop and phone screenshots inspected locally for layout. No browser page errors in the complete payment-flow test.

Not verified: physical iOS/Android builds, native haptic feel, device-wide usage APIs, store entitlements, release-build LAN HTTP permissions, internet deployment, large rooms or simultaneous play. The two-socket test uses localhost. Connected turns accept client-reported game scores. Screens-down is a labelled proxy/manual demo, not device-wide monitoring. Pool physics are deliberately simplified.
