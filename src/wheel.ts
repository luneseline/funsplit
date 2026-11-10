export type DoomCardData = {
  id: string;
  doom: boolean;
  message: string;
  playerId?: string;
};
export const safeCardMessages = [
  "YOU LIVE TO YAP ANOTHER DAY.",
  "THE UNIVERSE HAS SPARED YOU.",
  "NOT TODAY, BESTIE.",
  "YOUR LUCK IS SUSPICIOUSLY GOOD.",
  "YOU ARE SAFE. FOR NOW.",
  "PLOT ARMOUR ACTIVATED.",
  "BLESSED BY THE GROUP CHAT.",
  "THE CURSE CHOSE SOMEONE ELSE.",
];
export function shuffle<T>(values: T[], random: () => number = Math.random) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function createDoomDeck(
  count: number,
  random: () => number = Math.random,
): DoomCardData[] {
  return shuffle(
    Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      doom: i === 0,
      message:
        i === 0
          ? "CARD OF DOOM"
          : safeCardMessages[(i - 1) % safeCardMessages.length],
    })),
    random,
  );
}
