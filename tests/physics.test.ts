import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stepFlight,
  stepPool,
  initialPool,
  towerAim,
  arrowAim,
  arrowPoints,
  overlap,
} from "../src/render/physics.ts";
import { flight, pool } from "./fixtures/v02-physics.ts";
test("flight motion, flap velocity, hitboxes and gate scores match v0.2 over recorded inputs", () => {
  for (let run = 0; run < 30; run++) {
    let current = { y: 140, v: 0, x: 310, gap: 150, points: 0 },
      old = { ...current };
    for (let i = 0; i < 1000; i++) {
      if (i % (17 + (run % 7)) === 0) {
        current.v = -250;
        old.v = -250;
      }
      const gap = 100 + ((i * 37) % 125),
        r = stepFlight(current, 0.025, gap),
        dead = flight(old, 0.025, gap);
      assert.deepEqual(r.state, old);
      assert.equal(r.dead, dead);
      current = r.state;
      if (dead) break;
    }
  }
});
test("all legal billiards aim/power combinations preserve old motion, collisions and scores", () => {
  for (let angle = -90; angle <= 45; angle += 3)
    for (let power = 10; power <= 100; power += 10) {
      let state = initialPool();
      state.cue.vx = Math.cos((angle * Math.PI) / 180) * power * 6;
      state.cue.vy = Math.sin((angle * Math.PI) / 180) * power * 6;
      const old = structuredClone(state);
      for (let step = 0; step < 1000; step++) {
        const r = stepPool(state, 0.025),
          expected = pool(old.cue, old.ball, 0.025);
        assert.deepEqual(r.state, old);
        assert.equal(
          r.score,
          expected,
          `angle ${angle} / power ${power} / step ${step}`,
        );
        state = r.state;
        if (expected !== null) break;
      }
    }
});
test("tower aim, perfect threshold geometry and archery formulas retain v0.2 values", () => {
  for (let t = 0; t < 30000; t += 137) {
    assert.equal(
      towerAim(t, 6, 92),
      ((1 + Math.sin((t / 1000) * (2 + 6 * 0.12))) * (300 - 92)) / 2,
    );
    assert.equal(arrowAim(t), (1 - Math.cos((t / 1000) * 1.35)) * 120 + 30);
  }
  assert.deepEqual(overlap({ x: 70, w: 160 }, 90), { x: 90, w: 140 });
  assert.deepEqual(overlap({ x: 70, w: 160 }, 240), { x: 240, w: 0 });
  assert.equal(arrowPoints(150, 135), 100);
  assert.equal(arrowPoints(30, 15), 0);
});
test("flight gate wrapping and food-column collision edges preserve scoring and bounds", () => {
  const gate = stepFlight(
    { x: -44, y: 140, v: 0, gap: 150, points: 3 },
    0.025,
    222,
  );
  assert.equal(gate.gate, true);
  assert.equal(gate.state.points, 4);
  assert.equal(gate.state.x, 315);
  assert.equal(gate.state.gap, 222);
  assert.equal(gate.dead, false);
  assert.equal(
    stepFlight({ x: 80, y: 40, v: 0, gap: 150, points: 0 }, 0.025, 100).dead,
    true,
  );
  assert.equal(
    stepFlight({ x: 80, y: 150, v: 0, gap: 150, points: 0 }, 0.025, 100).dead,
    false,
  );
  assert.equal(
    stepFlight({ x: 200, y: 305, v: 0, gap: 150, points: 0 }, 0.025, 100).dead,
    true,
  );
});
