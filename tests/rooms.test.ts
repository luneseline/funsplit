import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { io, Socket } from "socket.io-client";
import { defaultConfig } from "../src/model.ts";
const delay = (n: number) => new Promise((r) => setTimeout(r, n));
const ack = (s: Socket, e: string, v: any) =>
  new Promise<any>((resolve, reject) => {
    s.timeout(10000).emit(e, v, (err: any, res: any) =>
      err ? reject(err) : resolve(res),
    );
  });
const room = (s: Socket, check: (r: any) => boolean) =>
  new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off("room", fn);
      reject(Error("Room update timeout"));
    }, 10000);
    const fn = (r: any) => {
      if (check(r)) {
        clearTimeout(timer);
        s.off("room", fn);
        resolve(r);
      }
    };
    s.on("room", fn);
  });
test("two clients share lobby, host starts, turns validate, disconnect resets", async () => {
  const proc = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    env: { ...process.env, PORT: "3012" },
    stdio: "pipe",
  });
  let a: Socket | undefined, b: Socket | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      proc.stdout.once("data", () => resolve());
      proc.once("error", reject);
      const startupTimer = setTimeout(
        () => reject(Error("Server startup timeout")),
        30000,
      );
      proc.stdout.once("data", () => clearTimeout(startupTimer));
    });
    a = io("http://localhost:3012", { transports: ["websocket"] });
    b = io("http://localhost:3012", { transports: ["websocket"] });
    await Promise.all(
      [a, b].map((s) => new Promise<void>((r) => s.on("connect", () => r()))),
    );
    const c = await ack(a, "create", { name: "Alex", face: "bean" });
    assert.match(c.code, /^[A-F0-9]{6}$/);
    const joined = room(a, (r) => r.players.length === 2);
    assert.equal(
      (await ack(b, "join", { name: "Sam", code: c.code })).code,
      c.code,
    );
    await joined;
    assert.match((await ack(b, "start", defaultConfig)).error, /host/);
    const started = room(a, (r) => r.session?.phase === "playing");
    assert.equal((await ack(a, "start", defaultConfig)).ok, true);
    let r = await started;
    assert.match(
      (await ack(b, "score", { sessionId: r.session.id, round: 0, value: 50 }))
        .error,
      /turn/,
    );
    await ack(a, "score", { sessionId: r.session.id, round: 0, value: 5 });
    const finished = room(a, (r) => r.session?.phase === "result");
    await ack(b, "score", { sessionId: r.session.id, round: 0, value: 8 });
    r = await finished;
    assert.equal(r.session.scores.length, 2);
    const reset = room(a, (r) => r.players.length === 1 && !r.session);
    b.disconnect();
    await reset;
  } finally {
    a?.disconnect();
    b?.disconnect();
    proc.kill();
  }
});
