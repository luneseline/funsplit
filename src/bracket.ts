export type Heat = {
  a: string;
  b: string;
  winner: string;
  taps: [number, number];
  stage: number;
};
export type Bracket = {
  queue: string[];
  next: string[];
  stage: number;
  heats: Heat[];
  champion: string | null;
  byes: string[];
};
export function createBracket(ids: string[]): Bracket {
  if (ids.length < 2 || ids.length > 8 || new Set(ids).size !== ids.length)
    throw Error("Need 2–8 unique players.");
  return normalize({
    queue: [...ids],
    next: [],
    stage: 0,
    heats: [],
    champion: null,
    byes: [],
  });
}
function normalize(b: Bracket): Bracket {
  if (b.queue.length === 1) {
    b = {
      ...b,
      next: [...b.next, b.queue[0]],
      byes: [...b.byes, b.queue[0]],
      queue: [],
    };
  }
  if (!b.queue.length) {
    if (b.next.length === 1) return { ...b, champion: b.next[0], next: [] };
    return { ...b, queue: b.next, next: [], stage: b.stage + 1 };
  }
  return b;
}
export function advanceBracket(b: Bracket, taps: [number, number]): Bracket {
  if (
    b.champion ||
    b.queue.length < 2 ||
    taps.some((v) => !Number.isInteger(v) || v < 0) ||
    taps[0] === taps[1]
  )
    throw Error("A heat needs a clear winner.");
  const [a, c] = b.queue,
    winner = taps[0] > taps[1] ? a : c;
  return normalize({
    ...b,
    queue: b.queue.slice(2),
    next: [...b.next, winner],
    heats: [...b.heats, { a, b: c, winner, taps, stage: b.stage }],
  });
}
export function bracketScores(
  b: Bracket,
  ids: string[],
): Record<string, number> {
  if (!b.champion) throw Error("Finish the bracket first.");
  return Object.fromEntries(
    ids.map((id) => {
      const played = b.heats.filter((h) => h.a === id || h.b === id),
        last = played.at(-1);
      return [
        id,
        id === b.champion
          ? 10000
          : last
            ? (last.stage + 1) * 1000 +
              Math.max(
                ...played.map((h) => Math.min(999, h.taps[h.a === id ? 0 : 1])),
              )
            : 0,
      ];
    }),
  );
}
