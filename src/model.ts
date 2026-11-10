export const games = [
  {
    id: "tower",
    name: "Stack attack",
    tag: "STEADY HANDS",
    icon: "▰",
    color: "#D7EFFF",
    description: "Drop moving blocks. Build the tallest tower.",
    unit: "levels",
  },
  {
    id: "race",
    name: "Tap tap, broke",
    tag: "FAST FINGERS",
    icon: "⚡",
    color: "#E9F056",
    description: "Two thumbs. One screen. A knockout race to the finish.",
    unit: "taps",
  },
  {
    id: "price",
    name: "Price of nice",
    tag: "BIG SPENDER",
    icon: "◆",
    color: "#FF5C34",
    description: "Guess the luxury price. Closest guess wins.",
    unit: "points",
  },
  {
    id: "flappy",
    name: "Snack flight",
    tag: "DODGE DINNER",
    icon: "🍔",
    color: "#AEBBAD",
    description: "Flap through a very inconvenient food court.",
    unit: "gates",
  },
  {
    id: "wheel",
    name: "Wheel of owe",
    tag: "PURE CHAOS",
    icon: "✳",
    color: "#E9F056",
    description: "Spin for your luck score. Lowest score pays.",
    unit: "luck",
  },
  {
    id: "pool",
    name: "Pocket money",
    tag: "ANGLE IT RIGHT",
    icon: "⑧",
    color: "#D7EFFF",
    description: "Aim the cue, set your power, pocket the ball.",
    unit: "points",
  },
  {
    id: "archery",
    name: "Bullseye bill",
    tag: "TAKE YOUR SHOT",
    icon: "◎",
    color: "#FF5C34",
    description: "Lock X. Lock Y. Let it fly. Three arrows, 30s each.",
    unit: "points",
  },
] as const;
export type GameId = (typeof games)[number]["id"];
export const faces = ["bean", "star", "ghost", "blob"] as const;
export type Player = { id: string; name: string; face: string; color: string };
export type Config = {
  game: GameId;
  rounds: number;
  tournament: boolean;
  purpose: "pay" | "eat" | "watch";
  options: string[];
};
export type Score = {
  playerId: string;
  round: number;
  game: GameId;
  value: number;
};
export type Session = {
  players: Player[];
  config: Config;
  phase: "lobby" | "playing" | "result";
  turn: number;
  round: number;
  scores: Score[];
  id: string;
};
export const defaultConfig: Config = {
  game: "tower",
  rounds: 1,
  tournament: false,
  purpose: "pay",
  options: ["Pizza", "Sushi", "Tacos"],
};
export function newSession(players: Player[], config: Config): Session {
  return {
    id: Math.random().toString(36).slice(2),
    players,
    config,
    phase: "playing",
    turn: 0,
    round: 0,
    scores: [],
  };
}
export function roundGame(s: Session): GameId {
  return s.config.tournament
    ? games[
        (games.findIndex((g) => g.id === s.config.game) + s.round) %
          games.length
      ].id
    : s.config.game;
}
export function submit(s: Session, playerId: string, value: number): Session {
  if (
    s.phase !== "playing" ||
    s.players[s.turn]?.id !== playerId ||
    !Number.isFinite(value)
  )
    throw Error("This is not your turn.");
  const scores = [
    ...s.scores,
    {
      playerId,
      round: s.round,
      game: roundGame(s),
      value: Math.max(0, Math.min(100000, Math.round(value))),
    },
  ];
  if (s.turn + 1 < s.players.length) return { ...s, scores, turn: s.turn + 1 };
  if (s.round + 1 < s.config.rounds)
    return { ...s, scores, turn: 0, round: s.round + 1 };
  return { ...s, scores, phase: "result" };
}
// Rank points normalize radically different game scales. Tied scores share points.
export function standings(s: Session) {
  return s.players
    .map((p) => ({
      ...p,
      points: s.scores
        .filter((v) => v.playerId === p.id)
        .reduce(
          (sum, v) =>
            sum +
            s.scores.filter((o) => o.round === v.round && o.value < v.value)
              .length,
          0,
        ),
    }))
    .sort((a, b) => b.points - a.points);
}
export function losers(s: Session) {
  const ranked = standings(s);
  return ranked.filter((p) => p.points === ranked[ranked.length - 1].points);
}
export function winners(s: Session) {
  const ranked = standings(s);
  return ranked.filter((p) => p.points === ranked[0].points);
}
export const prices = [
  {
    brand: "GUCCI",
    name: "GG Marmont small shoulder bag",
    emoji: "◆",
    price: 2220,
    description:
      "Quilted black shoulder bag; chain strap and detachable card holder.",
    details: "Style 751526 AAFPP 1061 · 8.3 × 4.7 × 2 in · Italian production",
    photo:
      "https://media.gucci.com/style/DarkGray_Center_0_0_490x245/1793705405/751526_AAFPP_1061_015_100_0000_Light-gg-marmont-small-shoulder-bag.jpg",
    source:
      "https://www.gucci.com/us/en/pr/women/handbags/mini-bags-for-women/gg-marmont-small-shoulder-bag-p-751526AAFPP1061",
  },
  {
    brand: "GUCCI",
    name: "GG Marmont wide belt",
    emoji: "◆",
    price: 570,
    description:
      "A black leather belt with the archival double-letter brass buckle.",
    details: "Style 400593 AP00T 1000 · 1.5 in wide · Italian production",
    photo:
      "https://media.gucci.com/style/DarkGray_Center_0_0_490x245/1781855108/400593_AP00T_1000_015_100_0000_Light-gg-marmont-wide-belt.jpg",
    source:
      "https://www.gucci.com/us/en/pr/women/accessories-for-women/belts-for-women/gg-marmont-wide-belt-p-400593AP00T1000",
  },
  {
    brand: "GUCCI",
    name: "Ace sneaker with Web",
    emoji: "◆",
    price: 760,
    description:
      "Low-top GG-pattern sneakers with striped sides, leather lining and rubber soles.",
    details: "Style 760775 FACMZ 9746 · Beige/ebony · Italian production",
    photo:
      "https://media.gucci.com/style/DarkGray_Center_0_0_490x245/1782829826/760775_FACMZ_9746_015_100_0000_Light-mens-gucci-ace-sneaker-with-web.jpg",
    source:
      "https://www.gucci.com/us/en/pr/men/shoes-for-men/sneakers-for-men/mens-gucci-ace-sneaker-with-web-p-760775FACMZ9746",
  },
];

// A shared-screen race posts the entire bracket atomically, once per round.
export function submitRaceRound(
  s: Session,
  values: Record<string, number>,
): Session {
  if (s.phase !== "playing" || roundGame(s) !== "race" || s.turn !== 0)
    throw Error("No race bracket is awaiting scores.");
  if (
    Object.keys(values).length !== s.players.length ||
    s.players.some(
      (p) =>
        !Number.isInteger(values[p.id]) ||
        values[p.id] < 0 ||
        values[p.id] > 10000,
    )
  )
    throw Error("Invalid bracket scores.");
  return s.players.reduce((next, p) => submit(next, p.id, values[p.id]), s);
}
