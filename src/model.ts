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
    description: "Spin a friend, pick a card, and dodge the doom.",
    unit: "survival",
  },
  {
    id: "yapathon",
    name: "Yapathon",
    tag: "ZERO EXCUSES",
    icon: "☏",
    color: "#FF5C34",
    description: "One minute. One topic. Just keep yapping.",
    unit: "points",
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
  priceOrder: string[];
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
    priceOrder: selectPriceQuestions([], config.rounds),
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
export type PriceQuestion = {
  id: string;
  category:
    | "food"
    | "tech"
    | "fashion"
    | "entertainment"
    | "travel"
    | "home"
    | "everyday"
    | "unusual";
  difficulty: "easy" | "medium" | "hard";
  brand: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  details: string;
  photo?: string;
  source: string;
  snapshot: string;
};
export const prices: PriceQuestion[] = [
  {
    id: "gucci-marmont-small",
    category: "fashion",
    difficulty: "hard",
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
    snapshot: "US retail snapshot · 10 Nov 2026 · before tax",
  },
  {
    id: "gucci-marmont-belt",
    category: "fashion",
    difficulty: "medium",
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
    snapshot: "US retail snapshot · 10 Nov 2026 · before tax",
  },
  {
    id: "gucci-ace-web",
    category: "fashion",
    difficulty: "medium",
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
    snapshot: "US retail snapshot · 10 Nov 2026 · before tax",
  },
  {
    id: "apple-airpods-pro-3",
    category: "tech",
    difficulty: "easy",
    brand: "APPLE",
    name: "AirPods Pro 3",
    emoji: "🎧",
    price: 249,
    description:
      "Apple's in-ear wireless headphones with active noise cancellation.",
    details: "AirPods Pro 3 · standard US list price",
    source: "https://www.apple.com/shop/buy-airpods/airpods-pro-3",
    snapshot: "US Apple list price · 10 Nov 2026 · before tax",
  },
  {
    id: "netflix-premium-month",
    category: "entertainment",
    difficulty: "easy",
    brand: "NETFLIX",
    name: "Premium plan · one month",
    emoji: "📺",
    price: 24.99,
    description: "One month of Netflix Premium in the United States.",
    details: "Monthly subscription · cancel anytime",
    source: "https://help.netflix.com/en/node/24926",
    snapshot: "US monthly list price · 10 Nov 2026 · before tax",
  },
  {
    id: "stanley-quencher-40",
    category: "everyday",
    difficulty: "easy",
    brand: "STANLEY",
    name: "Quencher H2.0 FlowState · 40 oz",
    emoji: "🥤",
    price: 45,
    description:
      "The 40-ounce handled stainless-steel tumbler with a reusable straw.",
    details: "40 oz · standard solid-colour edition",
    source:
      "https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz",
    snapshot: "US list price · 10 Nov 2026 · before tax",
  },
  {
    id: "dyson-airwrap-id",
    category: "home",
    difficulty: "medium",
    brand: "DYSON",
    name: "Airwrap i.d. multi-styler",
    emoji: "💨",
    price: 599.99,
    description: "A connected multi-styler and dryer with six attachments.",
    details: "Standard US set · non-sale price",
    source: "https://www.dyson.com/hair-care/hair-stylers/airwrap-id",
    snapshot: "US list price · 10 Nov 2026 · before tax",
  },
  {
    id: "starbucks-grande-latte",
    category: "food",
    difficulty: "medium",
    brand: "STARBUCKS",
    name: "Grande Caffè Latte",
    emoji: "☕",
    price: 5.45,
    description:
      "A 16-ounce Caffè Latte at a representative US company-operated store.",
    details: "Grande · prices vary by location; reference store price",
    source: "https://www.starbucks.com/menu/product/407/hot",
    snapshot: "Representative US menu price · 10 Nov 2026 · before tax",
  },
  {
    id: "disney-world-day-ticket",
    category: "travel",
    difficulty: "hard",
    brand: "WALT DISNEY WORLD",
    name: "One-day theme park ticket · starting price",
    emoji: "🏰",
    price: 119,
    description:
      "The advertised starting adult price for one park for one day.",
    details: "Ages 10+ · date-based pricing can cost more",
    source: "https://disneyworld.disney.go.com/admission/tickets/theme-parks/",
    snapshot: "Advertised US starting price · 10 Nov 2026 · before tax",
  },
  {
    id: "supreme-brick-retail",
    category: "unusual",
    difficulty: "hard",
    brand: "SUPREME",
    name: "Clay brick · original retail price",
    emoji: "🧱",
    price: 30,
    description:
      "The infamous red clay Supreme logo brick from the Fall/Winter 2016 collection.",
    details: "Original retail price, not resale value",
    source: "https://stockx.com/supreme-clay-brick-red",
    snapshot: "Documented original US retail price · 2016",
  },
];

export function selectPriceQuestions(
  recent: string[],
  count: number,
  random: () => number = Math.random,
) {
  const eligible = prices.filter((q) => !recent.includes(q.id));
  const pool = eligible.length >= count ? eligible : prices;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return Array.from(
    { length: count },
    (_, i) => shuffled[i % shuffled.length].id,
  );
}

export function priceForRound(s: Session, round: number) {
  return (
    prices.find((q) => q.id === s.priceOrder[round]) ||
    prices[round % prices.length]
  );
}

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

export function submitSharedRound(
  s: Session,
  values: Record<string, number>,
): Session {
  if (s.phase !== "playing" || s.turn !== 0)
    throw Error("No shared round is awaiting scores.");
  if (
    Object.keys(values).length !== s.players.length ||
    s.players.some(
      (p) =>
        !Number.isFinite(values[p.id]) ||
        values[p.id] < 0 ||
        values[p.id] > 100000,
    )
  )
    throw Error("Invalid shared-round scores.");
  return s.players.reduce((next, p) => submit(next, p.id, values[p.id]), s);
}
