# Architecture and engineering roadmap

## Current implementation

Expo SDK 58 + React Native + TypeScript. The same RN component tree runs on iOS/Android and via React Native Web. The server is Node + Socket.IO. No paid service, API key, external database, or cloud account is required to play locally.

```
App.tsx             navigation, setup, local storage, room client, results
src/model.ts        typed game registry, match transitions, rank scoring
src/Game.tsx         typed dispatcher to separate game components
src/games/           nine live game components
src/render/          worklet-safe physics, Reanimated FX, backgrounds, sprite states and pooled sounds
src/bracket.ts       pure knockout bracket, byes, results
src/Character.tsx    original SVG doodle characters
src/music.tsx        bundled Expo Audio loop and mute/background controls
src/ui.tsx          palette, buttons, characters, haptic adapter
server/index.ts     rooms, host authority, turn ownership, score acceptance
```

Shared-screen race rounds submit a complete score map with `raceScores`; Wheel and Yapathon use the equivalent `sharedScores` event. The server permits these events only from the host, verifies session/round/roster and applies all scores atomically. Individual `score` events are rejected during every shared-screen round. Other screens tell the crew to gather around the host’s phone.

The game registry is the candidate list: games can be removed from `games` after selection. Each produces a numeric score where higher is better. Price guesses become `max(0, 100000 - absoluteError)`. A shared pure transition function handles current player, round advancement, final result, and per-round rank points, so the local and network match follow the same rules.

Connected rooms carry configuration, roster, and an optional match snapshot. Host-only start/reset events prevent guests from resetting other players’ rounds. Scores carry session ID and round; the server rejects wrong players, non-finite values and stale submissions. Scores are bounded to 0–100000. Duplicate events cannot advance the same turn twice. Payload size and per-socket event rates are limited. Room codes use cryptographic randomness; these codes are invitations, not authentication credentials.

## Network lifecycle

Client connects → creates or joins room → host starts → current player plays locally → submits score → server advances → room snapshot broadcasts → next device becomes active → final snapshot shows result.

All demo game simulation runs on the active client. The server validates the match transition, not whether the score was honestly earned. This is suitable for friends testing prototypes; do not use it for cash stakes or competitive ranking. There is no anti-cheat guarantee. Host disconnect transfers leadership and resets the match. Any player disconnect resets the match rather than leaving a blocked turn. Room memory disappears when the server restarts.

A deployment needs a stable HTTPS Socket.IO endpoint, TLS termination supporting polling/WebSocket upgrade, explicit `ALLOWED_ORIGIN`, instance health checks, and process supervision. Native clients do not gain authentication from CORS. No hosted endpoint is provisioned by this repository. A single instance is sufficient for this demo. Do not put different instances behind a load balancer without sticky sessions and a shared room adapter.

## Production multiplayer

1. Issue a local anonymous player UUID plus a signed, short-lived room membership/reconnect token. Store reconnect credentials in platform secure storage. Separate player identity from socket ID.
2. Assign monotonic event sequence numbers, idempotency keys, and a server round clock. Add bounded reconnect grace, ready acknowledgements and recoverable match snapshots.
3. For simultaneous games, distribute a future server start timestamp after every device acknowledges assets/readiness. Estimate clock offset and make countdowns consistent.
4. Move scoring-relevant simulation to the server or replay timestamped validated inputs. Rate-limit taps and reject impossible acceleration, timing or score growth. Deterministic random seeds make replay verification possible for obstacles and wheel events.
5. Add Redis for transient rooms and a Socket.IO adapter only when running multiple server instances. Keep durable payment history opt-in; a local ledger is enough for an account-free app.

## Games and performance

The graphics architecture was upgraded in v0.3; see [the full rendering audit](GRAPHICS.md). Continuous simulation/aim values live in Reanimated shared values. Flight and pool retain canonical 25ms simulation steps and project remaining frame time into rendering. Animated SVG props update moving balls, aim guides and crosshairs on the native UI runtime. Static SVG scenes use gradients and bounded repeated geometry for material detail. React is used for actual inputs, scores and discrete phase changes, with low-rate HUD text refreshes. Loop callbacks and repeating effects are cleaned up when leaving a scene.

Pool retains equal-mass collision approximation, damping and discrete collision detection. The price deck is expanded through typed, dated entries while preserving free-form guesses and the existing score equation. The movement path is checked against frozen v0.2 flight/pool equations; all 460 legal billiards aim/power combinations match at the canonical timestep. Skia was evaluated and omitted to retain one cross-platform SVG scene renderer without CanvasKit. Reanimated handles motion, while Lottie is limited to a small native reward burst with a procedural web equivalent.

## Storage and results

AsyncStorage holds local crew, confirmed paid counts, recent price-question IDs and recent Yapathon topics. No server-side payment ledger or money movement exists. A match completion never increments a count automatically. A production history should store immutable events (session ID, payer UUID, timestamp, optional user-entered amount/currency), derive totals, prevent duplicate confirmations, support undo and export, and preserve identity across name changes. Current “recorded” protection applies to the visible result; it is not a durable financial audit trail. A room host can reset/rematch while each phone keeps its own payment history.

## Screens-down native boundary

Do not equate AppState background time with phone usage: locked and idle phones can be in the background. Current web mode logs only manual check-ins. Native demo additionally records app-away time for a selected person and clearly says what this measures.

A native spike should define a `UsageMonitor` interface (`authorization`, `begin`, `sample`, `end`) and separate iOS/Android modules. Determine entitlement eligibility first, then validate the exact event semantics. Run explicit cases: screen locked, always-on display, notification shade, another app, incoming call, low-power mode, force quit, permission revoked, offline device and clock changes. Do not enable automatic payer selection until missing/ambiguous measurements have an agreed fallback.

## Before release

Native CI/EAS builds; iOS/Android device coverage; larger text and screen-reader checks; reduced-motion/haptic preferences; result confetti budget; correct safe-area handling on cutout devices; persistent reconnect; input validation and malformed payload handling; server telemetry without names or gameplay payloads; encrypted transport; an actual price content licence/source; original art/audio rights; history management and undo. Keep all cloud/backend secrets out of `EXPO_PUBLIC_*` values, which are bundled into the client.

## Revision: game feel and audio

Archery uses horizontal → vertical → flight → impact states. Both aiming phases share one 30-second deadline per arrow, and flight controls lock until impact. Tower locks placement while a block falls, resolves overlap at impact, and runs a separate offcut animation. Both clean up timers and animations on unmount. Race bracket scores prioritize champion, elimination stage, then best heat taps; they are normalized by the existing per-round rank system.

Six new original event-driven audio cues are pooled at the root with an independent SFX mute. The original 8-second 120-BPM synth loop is generated by `scripts/make_music.py`, bundled as PCM WAV, and played by `expo-audio`. Playback starts with a user action, loops at a quiet volume, exposes mute in navigation and game panels, and pauses on background. Audio errors return the control to an off/retry state. SVG doodles render locally through `react-native-svg`; no external avatar service or copied character art is used.
