// Values and update order preserved from the v0.2 game. Worklet-safe, independently tested.
export type Flight = {
  y: number;
  v: number;
  x: number;
  gap: number;
  points: number;
};
export function stepFlight(input: Flight, dt: number, nextGap: number) {
  "worklet";
  const b = { ...input };
  b.v += 660 * dt;
  b.y += b.v * dt;
  b.x -= 100 * dt;
  let gate = false;
  if (b.x < -45) {
    b.x = 315;
    b.gap = nextGap;
    b.points++;
    gate = true;
  }
  const dead =
    b.y < 0 ||
    b.y > 302 ||
    (b.x < 90 && b.x + 42 > 60 && (b.y < b.gap - 68 || b.y + 28 > b.gap + 68));
  return { state: b, gate, dead };
}
export type Ball = { x: number; y: number; vx: number; vy: number };
export type Pool = {
  cue: Ball;
  ball: Ball & { hit: boolean; pocketed: boolean };
};
export function initialPool(): Pool {
  "worklet";
  return {
    cue: { x: 55, y: 240, vx: 0, vy: 0 },
    ball: { x: 220, y: 90, vx: 0, vy: 0, hit: false, pocketed: false },
  };
}
export function stepPool(input: Pool, dt: number) {
  "worklet";
  const state = { cue: { ...input.cue }, ball: { ...input.ball } },
    c = state.cue,
    o = state.ball;
  let score: number | null = null,
    impact = false,
    wall = false,
    scratch = false;
  for (const b of [c, o]) {
    if (b === o && o.pocketed) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= Math.pow(0.35, dt);
    b.vy *= Math.pow(0.35, dt);
    const pocket =
      Math.hypot(b.x - 20, b.y - 20) < 17 ||
      Math.hypot(b.x - 280, b.y - 20) < 17 ||
      Math.hypot(b.x - 20, b.y - 310) < 17 ||
      Math.hypot(b.x - 280, b.y - 310) < 17;
    if (pocket) {
      if (b === o) {
        o.pocketed = true;
        score = 100;
      } else {
        score = 0;
        scratch = true;
      }
      break;
    }
    if (b.x < 22 || b.x > 278) {
      b.vx *= -0.85;
      b.x = Math.max(22, Math.min(278, b.x));
      wall = true;
    }
    if (b.y < 22 || b.y > 308) {
      b.vy *= -0.85;
      b.y = Math.max(22, Math.min(308, b.y));
      wall = true;
    }
  }
  const dx = o.x - c.x,
    dy = o.y - c.y,
    d = Math.hypot(dx, dy);
  if (d > 0 && d < 23 && !o.hit) {
    const nx = dx / d,
      ny = dy / d,
      force = c.vx * nx + c.vy * ny;
    if (force > 0) {
      o.vx = nx * force;
      o.vy = ny * force;
      c.vx -= o.vx;
      c.vy -= o.vy;
      o.hit = true;
      impact = true;
    }
  }
  if (score === null && Math.hypot(c.vx, c.vy) + Math.hypot(o.vx, o.vy) < 12) {
    const near = Math.min(
      Math.hypot(o.x - 20, o.y - 20),
      Math.hypot(o.x - 280, o.y - 20),
      Math.hypot(o.x - 20, o.y - 310),
      Math.hypot(o.x - 280, o.y - 310),
    );
    score = o.hit ? Math.max(1, Math.round(70 - near / 3)) : 0;
  }
  return { state, score, impact, wall, scratch };
}
export function towerAim(ms: number, level: number, width: number) {
  "worklet";
  return ((1 + Math.sin((ms / 1000) * (2 + level * 0.12))) * (300 - width)) / 2;
}
export function arrowAim(ms: number) {
  "worklet";
  return (1 - Math.cos((ms / 1000) * 1.35)) * 120 + 30;
}
export function arrowPoints(x: number, y: number) {
  "worklet";
  return Math.max(0, Math.round(100 - Math.hypot(x - 150, y - 135) * 0.8));
}
export function overlap(base: { x: number; w: number }, x: number) {
  "worklet";
  const left = Math.max(base.x, x),
    right = Math.min(base.x + base.w, x + base.w);
  return { x: left, w: Math.max(0, right - left) };
}
