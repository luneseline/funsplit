import { createServer } from "node:http";
import { Server } from "socket.io";
import { randomBytes } from "node:crypto";
import {
  defaultConfig,
  newSession,
  submit,
  submitRaceRound,
  submitSharedRound,
  roundGame,
  games,
  type Session,
  type Player,
  type Config,
} from "../src/model.ts";
const http = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end("funsplit room server");
});
const io = new Server(http, {
  cors: { origin: process.env.ALLOWED_ORIGIN?.split(",") || "*" },
  maxHttpBufferSize: 10000,
});
type Room = {
  host: string;
  players: Player[];
  session: Session | null;
  config: Config;
  updated: number;
};
const rooms = new Map<string, Room>();
const clean = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, 24) : "";
io.on("connection", (socket) => {
  let code = "";
  let calls = 0;
  const rate = setInterval(() => (calls = 0), 1000);
  socket.onAny(() => {
    if (++calls > 25) socket.disconnect(true);
  });
  const send = () => {
    const r = rooms.get(code);
    if (r) io.to(code).emit("room", { code, ...r });
  };
  const safe =
    (fn: Function) =>
    (data: any, ack: Function = () => {}) => {
      try {
        fn(data, ack);
      } catch (e) {
        ack({ error: (e as Error).message });
      }
    };
  socket.on(
    "create",
    safe((data: any, ack: Function) => {
      if (code) throw Error("Leave the current room first.");
      code = randomBytes(3).toString("hex").toUpperCase();
      rooms.set(code, {
        host: socket.id,
        players: [
          {
            id: socket.id,
            name: clean(data.name) || "Host",
            face: clean(data.face) || "bean",
            color: "#E9F056",
          },
        ],
        session: null,
        config: defaultConfig,
        updated: Date.now(),
      });
      socket.join(code);
      ack({ code });
      send();
    }),
  );
  socket.on(
    "join",
    safe((data: any, ack: Function) => {
      if (code) throw Error("Leave the current room first.");
      const c = clean(data.code).toUpperCase(),
        r = rooms.get(c);
      if (!r) throw Error("Room not found. Check the code.");
      if (r.session) throw Error("Game in progress. Join the next one.");
      if (r.players.length >= 8) throw Error("Room is full.");
      code = c;
      r.players.push({
        id: socket.id,
        name: clean(data.name) || "Player",
        face: clean(data.face) || "star",
        color: ["#E9F056", "#FF5C34", "#D7EFFF", "#AEBBAD"][
          r.players.length % 4
        ],
      });
      socket.join(code);
      ack({ code });
      send();
    }),
  );
  socket.on(
    "start",
    safe((config: Config, ack: Function) => {
      const r = rooms.get(code);
      if (!r || r.host !== socket.id) throw Error("Only the host can start.");
      if (r.players.length < 2) throw Error("Invite at least one friend.");
      if (r.session?.phase === "playing")
        throw Error("Finish the current game first.");
      if (
        !games.some((g) => g.id === config.game) ||
        ![1, 3, 5, 7].includes(config.rounds) ||
        !["pay", "eat", "watch"].includes(config.purpose) ||
        !Array.isArray(config.options)
      )
        throw Error("Invalid game settings.");
      r.config = {
        ...config,
        options: config.options.map(clean).filter(Boolean).slice(0, 8),
      };
      if (config.purpose !== "pay" && r.config.options.length < 2)
        throw Error("Add two choices.");
      r.session = newSession(r.players, r.config);
      r.updated = Date.now();
      ack({ ok: true });
      send();
    }),
  );
  socket.on(
    "score",
    safe((data: any, ack: Function) => {
      const r = rooms.get(code);
      if (
        !r?.session ||
        r.session.id !== data.sessionId ||
        r.session.round !== data.round
      )
        throw Error("This round has already moved on.");
      if (["race", "wheel", "yapathon"].includes(roundGame(r.session)))
        throw Error("The host submits this shared-screen round.");
      r.session = submit(r.session, socket.id, data.value);
      r.updated = Date.now();
      ack({ ok: true });
      send();
    }),
  );
  socket.on(
    "raceScores",
    safe((data: any, ack: Function) => {
      const r = rooms.get(code);
      if (!r || r.host !== socket.id)
        throw Error("Only the host can submit a shared-screen bracket.");
      if (
        !r.session ||
        r.session.id !== data.sessionId ||
        r.session.round !== data.round
      )
        throw Error("This bracket has already moved on.");
      r.session = submitRaceRound(r.session, data.values);
      r.updated = Date.now();
      ack({ ok: true });
      send();
    }),
  );
  socket.on(
    "sharedScores",
    safe((data: any, ack: Function) => {
      const r = rooms.get(code);
      if (!r || r.host !== socket.id)
        throw Error("Only the host can submit a shared-screen round.");
      if (
        !r.session ||
        r.session.id !== data.sessionId ||
        r.session.round !== data.round
      )
        throw Error("This shared round has already moved on.");
      if (!["wheel", "yapathon"].includes(roundGame(r.session)))
        throw Error("This is not a group round.");
      r.session = submitSharedRound(r.session, data.values);
      r.updated = Date.now();
      ack({ ok: true });
      send();
    }),
  );
  socket.on(
    "reset",
    safe((_: any, ack: Function) => {
      const r = rooms.get(code);
      if (!r || r.host !== socket.id) throw Error("Only the host can reset.");
      r.session = null;
      ack({ ok: true });
      send();
    }),
  );
  socket.on("disconnect", () => {
    clearInterval(rate);
    const r = rooms.get(code);
    if (!r) return;
    r.players = r.players.filter((p) => p.id !== socket.id);
    r.session = null;
    if (!r.players.length) rooms.delete(code);
    else {
      if (r.host === socket.id) r.host = r.players[0].id;
      io.to(code).emit(
        "notice",
        "A player disconnected. The match was returned to the lobby.",
      );
      send();
    }
  });
});
setInterval(() => {
  for (const [code, r] of rooms)
    if (Date.now() - r.updated > 6 * 60 * 60 * 1000) {
      io.to(code).emit("notice", "Room expired. Create a new room.");
      io.in(code).disconnectSockets(true);
      rooms.delete(code);
    }
}, 60000);
http.listen(Number(process.env.PORT) || 3001, "0.0.0.0", () =>
  console.log("Room server on :" + (process.env.PORT || 3001)),
);
