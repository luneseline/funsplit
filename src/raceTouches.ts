export type RaceTouch = { identifier: number; locationX: number };

export function consumeRaceTouchStarts(
  touches: RaceTouch[],
  width: number,
  active: Set<number>,
) {
  const lanes: number[] = [];
  for (const touch of touches) {
    const id = Number(touch.identifier);
    if (active.has(id)) continue;
    active.add(id);
    lanes.push(Number(touch.locationX) < width / 2 ? 0 : 1);
  }
  return lanes;
}

export function releaseRaceTouches(
  touches: Pick<RaceTouch, "identifier">[],
  active: Set<number>,
) {
  for (const touch of touches) active.delete(Number(touch.identifier));
}
