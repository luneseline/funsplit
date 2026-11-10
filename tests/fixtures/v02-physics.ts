// Frozen v0.2 equations, independent oracle for the renderer migration.
export function flight(b: any, dt: number, gap: number) {
  b.v += 660 * dt;
  b.y += b.v * dt;
  b.x -= 100 * dt;
  if (b.x < -45) {
    b.x = 315;
    b.gap = gap;
    b.points++;
  }
  return (
    b.y < 0 ||
    b.y > 302 ||
    (b.x < 90 && b.x + 42 > 60 && (b.y < b.gap - 68 || b.y + 28 > b.gap + 68))
  );
}
export function pool(c: any, o: any, dt: number) {
  let result: number | null = null;
  for (const b of [c, o]) {
    if (b === o && o.pocketed) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= Math.pow(0.35, dt);
    b.vy *= Math.pow(0.35, dt);
    if (
      [
        [20, 20],
        [280, 20],
        [20, 310],
        [280, 310],
      ].some(([x, y]) => Math.hypot(b.x - x, b.y - y) < 17)
    ) {
      if (b === o) {
        o.pocketed = true;
        result = 100;
      } else result = 0;
      break;
    }
    if (b.x < 22 || b.x > 278) {
      b.vx *= -0.85;
      b.x = Math.max(22, Math.min(278, b.x));
    }
    if (b.y < 22 || b.y > 308) {
      b.vy *= -0.85;
      b.y = Math.max(22, Math.min(308, b.y));
    }
  }
  const dx = o.x - c.x,
    dy = o.y - c.y,
    d = Math.hypot(dx, dy);
  if (d > 0 && d < 23 && !o.hit) {
    const nx = dx / d,
      ny = dy / d,
      impact = c.vx * nx + c.vy * ny;
    if (impact > 0) {
      o.vx = nx * impact;
      o.vy = ny * impact;
      c.vx -= o.vx;
      c.vy -= o.vy;
      o.hit = true;
    }
  }
  if (Math.hypot(c.vx, c.vy) + Math.hypot(o.vx, o.vy) < 12 && result === null) {
    const distance = Math.min(
      ...[
        [20, 20],
        [280, 20],
        [20, 310],
        [280, 310],
      ].map(([x, y]) => Math.hypot(o.x - x, o.y - y)),
    );
    result = o.hit ? Math.max(1, Math.round(70 - distance / 3)) : 0;
  }
  return result;
}
