# funsplit ✳

**Big decisions. Tiny games.** A React Native / Expo party app for deciding who pays, where to eat, and what to watch. All seven candidate games are playable in this demo so the group can choose what stays.

![funsplit arcade demo](docs/images/arcade.png)

## Run

Node.js 22.13+ (Node 24 recommended), npm, and Expo Go compatible with SDK 58, or an Expo development build.

```sh
npm ci
npm start
# w = web, a = Android, i = iOS (iOS simulator requires macOS)
```

For a browser directly: `npm run web`. For Android/iOS development builds: `npm run android` / `npm run ios`. Haptics run on supported native devices; web vibration is a best-effort fallback. A device/simulator build is still needed to verify native haptics and lifecycle behaviour.

### Individual phones

```sh
# Terminal 1
npm run server
# Terminal 2
npm start
```

Use **Connect our phones**, enter a reachable server URL (for example `http://192.168.1.10:3001` on the same Wi-Fi), choose a name and character, and create a room. Friends enter the same server URL and six-character room code. Never use `localhost` to address another computer from a phone. Optionally set `EXPO_PUBLIC_ROOM_URL` using `.env.example`. Native release builds should use a trusted HTTPS endpoint; local HTTP support varies by platform/build configuration.

The host starts and configures games. Each player controls their own turn from their own screen. Other screens show who is playing. Most connected games use individual turns. **Tap tap, broke is a shared-screen knockout bracket:** two friends play simultaneously on the host’s phone, then the host posts the whole bracket’s results to the room. Disconnecting a player returns the room to its lobby and transfers hosting if needed. Rooms live in server memory and expire after six hours. This server is a working demo, not a deployed service.

**v0.3.1 fixes the native Worklets `invalidTransform` error.** Pull the update and restart Metro with `npx expo start --go --clear`.

## Graphics upgrade (v0.3)

Every game now uses the shared motion/effects layer. Continuous flight, billiards, crane aim and crosshair movement use Reanimated shared values and frame callbacks instead of forcing React redraws. Gameplay constants, scores and multiplayer rules are preserved. Effects include articulated character states, layered scenery, shaded materials, bounded particles, animated counters, checkpoint pulses, bow/cue recoil, transitions and six original event-driven sound cues. Use **SFX ON/OFF** separately from the music toggle.

Native reward bursts use a small bundled Lottie animation. The web equivalent uses Reanimated particles. Skia, Rive and sprite-sheet alternatives were evaluated; see the [per-game inspection and renderer decisions](docs/GRAPHICS.md).

New gameplay captures: [tower](docs/images/graphics/tower.png), [race](docs/images/graphics/race.png), [price](docs/images/graphics/price.png), [flight](docs/images/graphics/flight.png), [wheel](docs/images/graphics/wheel.png), [pool](docs/images/graphics/pool.png), [archery](docs/images/graphics/archery.png).

## Included

- **Stack attack:** crane drops, animated falling blocks, perfect landings, falling offcuts, overlap trimming, a 30-second limit and 12-floor cap.
- **Tap tap, broke:** 2–8 player knockout bracket, simultaneous independent tap pads, countdown, three checkpoints, finish stripe, confetti, byes for odd crews and sudden-death ties. First to 60 taps; after 20 seconds the leader wins.
- **Price of nice:** real Gucci bag, belt and sneaker photo cards with style IDs, descriptions and dated US retail snapshots. Closest guess wins. Answers and official source links reveal after all guesses. Photos stream from Gucci and require internet.
- **Snack flight:** gravity, flap control, food columns, collisions, gate scoring.
- **Wheel of owe:** a labelled ten-sector wheel, animated spin, matching pointer result and 10–100 luck score. Lowest loses.
- **Pocket money:** one-shot billiards with cue/object collision, friction, cushion bounces, corner pockets, scratches and distance-based near-miss scores. Simplified 2D physics, not a full ruleset of eight-ball.
- **Bullseye bill:** 30 seconds per arrow: lock horizontal aim, lock vertical aim, then watch the bow release and arrow fly. Three arrows, distance scoring, zero for expired arrows.
- Custom local player names and four original doodle characters with sketch outlines, hands, feet, accessories and expressions, 2–8 people.
- Single-phone and room-based play, repeated games or mixed tournaments over 1/3/5/7 rounds.
- Per-round rank points normalize incompatible game scores. Shared ranks preserve ties. Lowest total pays; highest total earns the decision. Tied groups agree or rematch.
- Winner chooses from a custom restaurant/movie shortlist. These decisions never increment payment counts.
- Animated loser reveal, confetti, a teasing roast, native haptic hooks.
- Original bundled arcade music: tap **Music off** to start, use the same control to mute. Audio pauses when the app backgrounds. No third-party samples or streaming dependency.
- Local, persistent **Hall of shame**, updated only when a payment is confirmed. No money is charged or transferred. Each device maintains its own history.
- **Screens down honesty demo:** voluntary check-ins and a native app-background-time proxy attributed to a selected player. Clearly labelled; no claim to measure other apps or total screen time. Web uses manual check-ins only.

## Update an existing checkout

```sh
git pull
npm ci
npx expo start --go --clear
```

If you run connected rooms, restart `npm run server` too; the new race-bracket event needs the updated server.

Native dependencies match Expo SDK 58. Expo Go must support that SDK; a custom development client needs rebuilding after adding Reanimated/Worklets/Lottie. This upgrade was checked by JavaScript bundle export, not by physical iOS/Android gameplay profiling.

## Validate

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser tests default to `/usr/bin/chromium`; set `CHROMIUM_PATH` for another installation, or adapt the Playwright launch configuration to a downloaded browser. See [validation](docs/VALIDATION.md) for what was actually verified.

## Read next

- [Product and experience plan](docs/PRODUCT.md)
- [Architecture and engineering roadmap](docs/ARCHITECTURE.md)
- [Photos, price sources and original music](docs/ASSETS.md)
- [Graphics architecture, per-game audit and preservation tests](docs/GRAPHICS.md)

Updated game screens:

![Same-screen knockout race](docs/images/race.png)
![Two-stage archery](docs/images/archery.png)
![Falling tower blocks](docs/images/tower.png)

Palette: `#E9F056` (the supplied `#e9fo56` interpreted as a zero), `#FF5C34`, `#D7EFFF`, `#351E28`, `#AEBBAD`.
