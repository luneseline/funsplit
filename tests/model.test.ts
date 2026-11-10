import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newSession,
  submit,
  standings,
  losers,
  roundGame,
  defaultConfig,
} from "../src/model.ts";
const players = [
  { id: "a", name: "A", face: "bean", color: "#E9F056" },
  { id: "b", name: "B", face: "ghost", color: "#FF5C34" },
];
test("turn order rejects invalid and duplicate submissions", () => {
  let s = newSession(players, defaultConfig);
  assert.throws(() => submit(s, "b", 1));
  assert.throws(() => submit(s, "a", NaN));
  s = submit(s, "a", 5);
  assert.throws(() => submit(s, "a", 5));
  s = submit(s, "b", 8);
  assert.equal(s.phase, "result");
  assert.equal(losers(s)[0].id, "a");
  assert.throws(() => submit(s, "b", 9));
});
test("tournament normalizes scores by per-round rank", () => {
  let s = newSession(players, {
    ...defaultConfig,
    rounds: 3,
    tournament: true,
  });
  for (const [a, b] of [
    [3, 1],
    [5, 20],
    [99990, 99980],
  ]) {
    s = submit(s, "a", a);
    s = submit(s, "b", b);
  }
  assert.equal(s.phase, "result");
  assert.deepEqual(
    standings(s).map((p) => [p.id, p.points]),
    [
      ["a", 2],
      ["b", 1],
    ],
  );
});
test("ties are preserved rather than silently choosing a payer", () => {
  let s = newSession(players, defaultConfig);
  s = submit(s, "a", 4);
  s = submit(s, "b", 4);
  assert.equal(losers(s).length, 2);
});
test("repeated rounds retain game while tournament cycles", () => {
  let s = newSession(players, { ...defaultConfig, rounds: 3 });
  s = submit(submit(s, "a", 1), "b", 2);
  assert.equal(roundGame(s), "tower");
  assert.equal(
    roundGame({ ...s, config: { ...s.config, tournament: true } }),
    "race",
  );
});
