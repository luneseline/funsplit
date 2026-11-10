import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBracket,
  advanceBracket,
  bracketScores,
} from "../src/bracket.ts";
import { newSession, submitRaceRound, defaultConfig } from "../src/model.ts";
test("every 2–8 player bracket finishes with exactly n-1 heats, including odd byes", () => {
  for (let n = 2; n <= 8; n++) {
    const ids = Array.from({ length: n }, (_, i) => String(i));
    let b = createBracket(ids);
    for (let i = 0; i < n - 1; i++) b = advanceBracket(b, [60, 40]);
    assert.ok(b.champion);
    assert.equal(b.heats.length, n - 1);
    assert.equal(bracketScores(b, ids)[b.champion!], 10000);
    assert.equal(Object.keys(bracketScores(b, ids)).length, n);
  }
});
test("ties require sudden death and cannot advance bracket", () =>
  assert.throws(() => advanceBracket(createBracket(["a", "b"]), [40, 40])));
test("race scores apply all players once and advance one round atomically", () => {
  const ps = ["a", "b", "c"].map((id) => ({
    id,
    name: id,
    face: "bean",
    color: "#E9F056",
  }));
  const s = newSession(ps, { ...defaultConfig, game: "race", rounds: 3 });
  assert.throws(() => submitRaceRound(s, { a: 10000, b: 500 }));
  const next = submitRaceRound(s, { a: 10000, b: 1020, c: 2040 });
  assert.equal(next.round, 1);
  assert.equal(next.turn, 0);
  assert.equal(next.scores.length, 3);
  assert.throws(() =>
    submitRaceRound(newSession(ps, defaultConfig), { a: 1, b: 2, c: 3 }),
  );
});
