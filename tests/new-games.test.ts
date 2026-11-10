import { test } from "node:test";
import assert from "node:assert/strict";
import { createDoomDeck } from "../src/wheel.ts";
import {
  defaultConfig,
  newSession,
  prices,
  selectPriceQuestions,
  submitSharedRound,
} from "../src/model.ts";
import { pickTopic, secondsRemaining, yapTopics } from "../src/yapathon.ts";
import {
  consumeRaceTouchStarts,
  releaseRaceTouches,
} from "../src/raceTouches.ts";

const players = [
  { id: "a", name: "A", face: "bean", color: "#E9F056" },
  { id: "b", name: "B", face: "ghost", color: "#FF5C34" },
  { id: "c", name: "C", face: "star", color: "#D7EFFF" },
];

test("price selection avoids recent questions and repeats within a session", () => {
  const recent = prices.slice(0, 3).map((q) => q.id);
  const chosen = selectPriceQuestions(recent, 7, () => 0.42);
  assert.equal(chosen.length, 7);
  assert.equal(new Set(chosen).size, 7);
  assert.equal(
    chosen.some((id) => recent.includes(id)),
    false,
  );
});

test("price selection falls back safely when the fresh bank is exhausted", () => {
  const chosen = selectPriceQuestions(
    prices.map((q) => q.id),
    5,
    () => 0.2,
  );
  assert.equal(chosen.length, 5);
  assert.equal(new Set(chosen).size, 5);
  assert.ok(chosen.every((id) => prices.some((q) => q.id === id)));
});

test("doom deck always has one card per player and exactly one doom", () => {
  for (let count = 2; count <= 8; count++) {
    const deck = createDoomDeck(count, () => 0.37);
    assert.equal(deck.length, count);
    assert.equal(deck.filter((card) => card.doom).length, 1);
    assert.equal(
      new Set(deck.filter((card) => !card.doom).map((card) => card.message))
        .size,
      count - 1,
    );
  }
});

test("shared group scores are atomic and reject missing players", () => {
  let session = newSession(players, { ...defaultConfig, game: "wheel" });
  assert.throws(() => submitSharedRound(session, { a: 100, b: 0 }));
  session = submitSharedRound(session, { a: 100, b: 0, c: 100 });
  assert.equal(session.phase, "result");
  assert.equal(session.scores.length, 3);
});

test("topic picker avoids recent topics and has an exhaustion fallback", () => {
  const recent = yapTopics.slice(0, yapTopics.length - 1);
  assert.equal(
    pickTopic(recent, () => 0),
    yapTopics[yapTopics.length - 1],
  );
  assert.ok(yapTopics.includes(pickTopic(yapTopics, () => 0.5)));
});

test("Yapathon countdown derives from an absolute deadline across interruptions", () => {
  assert.equal(secondsRemaining(61_000, 1_000), 60);
  assert.equal(secondsRemaining(61_000, 31_001), 30);
  assert.equal(secondsRemaining(61_000, 90_000), 0);
});

test("one native touch batch registers both race lanes once", () => {
  const active = new Set<number>();
  assert.deepEqual(
    consumeRaceTouchStarts(
      [
        { identifier: 11, locationX: 30 },
        { identifier: 12, locationX: 270 },
      ],
      300,
      active,
    ),
    [0, 1],
  );
  assert.deepEqual(
    consumeRaceTouchStarts([{ identifier: 11, locationX: 31 }], 300, active),
    [],
  );
  releaseRaceTouches([{ identifier: 11 }], active);
  assert.deepEqual(
    consumeRaceTouchStarts([{ identifier: 11, locationX: 32 }], 300, active),
    [0],
  );
});
