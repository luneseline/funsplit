# Product and experience plan

## The promise

A decision should take less effort than arguing about it. funsplit turns a mundane group choice into a miniature event: pick a stake, pick a game, play, reveal. The app should get out of the way once the table has its answer. No account, contact access, feed, payment integration, or mandatory onboarding is needed for the first game.

The emotional rhythm is anticipation → tiny skill challenge → public suspense → absurd verdict. Characters carry that rhythm: idle wiggles in the lobby, effort during the game, shock for the loser, smug celebration for the winner. Keep the rounds short enough that spectators stay involved.

## First-session flow

1. Land in the arcade, see all nine games and a clear “Let’s settle it” action.
2. Choose one phone or connected phones. Single-phone play starts with two editable names; no room setup required.
3. Choose the stake: pay, eat, or watch. For eat/watch, enter a shortlist first; the winner earns the final pick. This makes the result actionable without pretending to know local restaurants or streaming availability.
4. Choose a game, number of rounds, and whether to mix games. Defaults are one round and one game.
5. Each player sees their own “You’re up” screen, instructions, and an explicit ready button. No timer starts while the phone is being passed.
6. Scores remain visible. The app translates them to rank points and shows a shared result. Ties remain ties; rematch or agree a shared outcome.
7. Reveal the unlucky payer with a bouncing character and one roast. For a bill, a human confirms actual payment before the local history changes. For a choice, the winning player selects from the shortlist.

## Crew and identity

Two to eight people, 24-character names, four expressive original doodle character families, and palette-based player colours. The demo saves a local crew. Names and silhouettes make identity readable without colour alone. A production version should add colour selection, more character accessories, duplicate-name disambiguation, and a one-tap “usual crew” preset. Give players a persistent local UUID and reconnect token so renaming doesn’t split their payment history. The current connected demo uses socket identity and name matching for local history; this is not a global identity system.

## Candidate game evaluation

| Game           | Hook                                  | Skill / fairness          | Demo treatment                            | Selection question                                            |
| -------------- | ------------------------------------- | ------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Stack attack   | Everyone can see the imminent mistake | Timing, overlap precision | Crane drops / 12 floors / 30 seconds      | Does watching remain fun after three rounds?                  |
| Tap tap, broke | Immediate frantic competition         | Tap rate over 10 seconds  | Same-screen knockout heats                | Is tapping tiring or fun at the table?                        |
| Price of nice  | Surprise price reveal                 | Smallest absolute error   | Real designer photos and dated USD retail | Do people enjoy luxury, bill, or absurd-item categories most? |
| Snack flight   | Familiar one-button chaos             | Gates survived            | Food columns with generous gap            | Is failure funny without being frustrating?                   |
| Wheel of owe   | No skill or explanation needed        | Fair wheel + hidden card  | Dynamic names and exactly one doom card   | Does the two-stage suspense stay quick enough?                |
| Yapathon       | The room becomes the referee          | Talking under pressure    | 60s offline timer and manual call-out     | Do spectators stay engaged for every turn?                    |
| Pocket money   | Satisfying tactile shot               | Physics and aim           | One orange ball / one shot                | Is aiming too slow for the core loop?                         |
| Bullseye bill  | Tension before release                | Three timed releases      | Two-stage aim / 30s per arrow / 300 max   | Does three-shot play feel quick enough?                       |

The wheel first chooses the opening picker, then randomizes the remaining order independently from a hidden deck containing one doom card. Safe players receive a higher shared-round score so the existing tournament contract still works.

## Tournaments

Repeated mode reruns the same game; mixed mode cycles through the arcade starting with the chosen game. Each completed round gives one rank point for every opponent whose score a player beats. Equal scores receive equal points. Raw scores never carry across different games. Lowest total takes the bill; highest total earns the restaurant/movie choice. The result screen should make this rule obvious before anyone plays. Production enhancements: a shuffled playlist, a visible inter-round standings break, opt-in elimination, and a short skill-based tie-breaker.

## Humour, motion, touch

Keep the requested mean jokes aimed at gameplay and the wallet: “Your gameplay was a donation to everyone else’s evening.” Avoid personal attributes; allow a friendly/roast toggle in production. The demo has one roast, a labelled rotating wheel, independent race lanes and finish celebrations, falling tower blocks and offcuts, bow/arrow flight, confetti, button feedback, and a bouncing reveal. An original bundled arcade loop sets the vibe with an explicit music toggle. Native hooks provide light impacts for inputs and a success pattern for finished turns/results. Web browsers may ignore vibration. Add reduced-motion handling, mute toggles, restrained haptic cadence for tap races, and a wider roast library before release.

## Screens down

Desired final experience: every participant joins a hangout, consents to an agreed measurement, puts their phone away, and sees the most distracted person revealed at the end. A one-phone group cannot automatically measure everybody’s other devices.

The demo uses an explicitly labelled honesty tracker: pick the person, log 30-second check-ins, and optionally attribute native time away from this app to that person. Background time includes locked time and is not a reliable measure of use. It must never be marketed as total screen time. Ending a hangout only reports the group’s highest recorded usage; it does not automatically charge or log a payer.

For production, prototype OS capabilities before choosing the rule. iOS FamilyControls/DeviceActivity needs entitlement approval and system authorization; it does not expose arbitrary foreground apps through ordinary React Native APIs. Android UsageStats needs explicit usage-access permission and platform-specific implementation. Lock state, multitasking, clock changes, background suspension, and missing permissions all affect fairness. A narrower “who leaves this app” challenge is easier, but measures a different behaviour. Keep honesty mode as the frictionless fallback.

## What to learn from the demo

Run a six-person hangout, try every game once, then repeat only favourites. Observe time to first action, instruction rereads, average round duration, spectator laughter, perceived fairness, and willingness to rematch. Ask each person to keep three games and cut two. Do not collect analytics silently; start with an observation sheet. A strong v1 could ship three excellent games, the wheel, and one reliable decision flow instead of retaining all nine.

## Delivery sequence

- Demo (this repository): every candidate playable, local persistence, working room server, explicit limitations.
- Playtest revision: refine physics and touch targets, original animation assets, haptic tuning, accessibility and reduced motion, deeper price data.
- Multiplayer beta: persistent anonymous identity, reconnection, authoritative timing, synchronized countdowns and optional cross-device races.
- Screens-down research: entitlement proof, on-device measurement validation, consent flow and a fairness review with real devices.
- Store release: native build testing, original branded art, privacy policy matching actual data collection, monitoring, backend deployment and release automation.

## Same-screen race revision

Tap tap, broke is always a mini knockout tournament, even when mixed-game mode is off. Pair the crew in roster order; winners advance and odd players receive a visible bye. Each heat starts with a shared countdown. Both friends tap separate large pads on the same phone, with three quarter-distance checkpoints and a finish stripe at 60 taps. A 20-second cap keeps a slow heat moving; tied scores enter next-tap sudden death. Finish feedback includes a character overshoot, confetti and a heat winner card. In a connected room, run the shared-screen bracket on the host’s device.
