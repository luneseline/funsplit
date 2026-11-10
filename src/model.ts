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
    description: "Ten seconds. Tap like your wallet depends on it.",
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
    description: "Stop the drifting aim. Three arrows to glory.",
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
  { name: "Designer carry-on", emoji: "🧳", price: 3200 },
  { name: "Swiss automatic watch", emoji: "⌚", price: 8500 },
  { name: "Sculptural lounge chair", emoji: "🪑", price: 4200 },
  { name: "Dinner for four", emoji: "🍽️", price: 280 },
];
