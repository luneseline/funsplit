import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  AppState,
  Platform,
  useWindowDimensions,
  Switch,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import {
  games,
  prices,
  faces,
  defaultConfig,
  newSession,
  submit,
  submitRaceRound,
  standings,
  losers,
  winners,
  roundGame,
  type Player,
  type Config,
  type Session,
  type GameId,
} from "./src/model";
import { C, s, Button, Chip, Character, GameArt, buzz } from "./src/ui";
import Game from "./src/Game";
import Race from "./src/games/Race";
import { Burst } from "./src/games/shared";
import { usePartyMusic, MusicButton } from "./src/music";
type Ledger = {
  id: string;
  name: string;
  face: string;
  color: string;
  paid: number;
};
type Room = {
  code: string;
  host: string;
  players: Player[];
  session: Session | null;
};
const initial: Player[] = [
  { id: "p1", name: "You", face: "bean", color: C.yellow },
  { id: "p2", name: "Bestie", face: "ghost", color: C.orange },
];
export default function App() {
  const music = usePartyMusic();
  const { width } = useWindowDimensions(),
    wide = width > 850;
  const [tab, setTab] = useState("Arcade"),
    [players, setPlayers] = useState<Player[]>(initial),
    [config, setConfig] = useState<Config>(defaultConfig),
    [session, setSession] = useState<Session | null>(null),
    [setup, setSetup] = useState(false),
    [roomModal, setRoomModal] = useState(false),
    [room, setRoom] = useState<Room | null>(null),
    [name, setName] = useState(""),
    [face, setFace] = useState("bean"),
    [code, setCode] = useState(""),
    [url, setUrl] = useState(process.env.EXPO_PUBLIC_ROOM_URL || ""),
    [error, setError] = useState(""),
    [ledger, setLedger] = useState<Ledger[]>([]),
    [recorded, setRecorded] = useState(false),
    [ready, setReady] = useState(false),
    [disconnect, setDisconnect] = useState(false),
    [tieChoice, setTieChoice] = useState("");
  const socket = useRef<Socket | null>(null),
    bounce = useRef(new Animated.Value(0)).current;
  const [focus, setFocus] = useState(false),
    [focusRunning, setFocusRunning] = useState(false),
    [usage, setUsage] = useState<Record<string, number>>({}),
    [focusPlayer, setFocusPlayer] = useState("p1"),
    [focusSeconds, setFocusSeconds] = useState(0),
    [focusDone, setFocusDone] = useState(false);
  const restored = useRef(false);
  useEffect(() => {
    AsyncStorage.multiGet(["funsplit.players", "funsplit.ledger"])
      .then((rows) => {
        for (const [key, val] of rows)
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                if (key.endsWith("players") && parsed.length >= 2)
                  setPlayers(parsed);
                if (key.endsWith("ledger")) setLedger(parsed);
              }
            } catch {}
          }
      })
      .catch(() =>
        setError("Local storage is unavailable. Changes may not persist."),
      )
      .finally(() => {
        restored.current = true;
        setReady(true);
      });
    return () => {
      socket.current?.disconnect();
    };
  }, []);
  useEffect(() => {
    if (restored.current)
      AsyncStorage.setItem("funsplit.players", JSON.stringify(players)).catch(
        () => setError("Could not save players on this device."),
      );
  }, [players]);
  useEffect(() => {
    if (restored.current)
      AsyncStorage.setItem("funsplit.ledger", JSON.stringify(ledger)).catch(
        () => setError("Could not save the leaderboard."),
      );
  }, [ledger]);
  useEffect(() => {
    if (session?.phase === "result") {
      setRecorded(false);
      setTieChoice("");
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: -14,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      ).start();
      buzz(true);
    } else bounce.stopAnimation();
  }, [session?.phase, session?.id]);
  useEffect(() => {
    if (!focusRunning) return;
    const timer = setInterval(() => setFocusSeconds((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);
  // Honest shared-phone proxy: voluntary check-ins, not device-wide surveillance.
  useEffect(() => {
    if (!focusRunning) return;
    let left = 0;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") left = Date.now();
      else if (left) {
        setUsage((v) => ({
          ...v,
          [focusPlayer]:
            (v[focusPlayer] || 0) +
            Math.max(1, Math.round((Date.now() - left) / 1000)),
        }));
        left = 0;
      }
    });
    return () => sub.remove();
  }, [focusRunning, focusPlayer]);
  function openSetup(game: GameId) {
    setConfig((v) => ({ ...v, game }));
    setError("");
    setSetup(true);
  }
  function start() {
    if (players.length < 2) {
      setError("Add at least two players.");
      return;
    }
    if (
      config.purpose !== "pay" &&
      config.options.filter((v) => v.trim()).length < 2
    ) {
      setError("Add at least two choices.");
      return;
    }
    setError("");
    if (room) {
      if (!socket.current?.connected) {
        setError("Reconnect before starting.");
        return;
      }
      socket.current.emit("start", config, (res: any) => {
        if (res.error) setError(res.error);
        else setSetup(false);
      });
    } else {
      setSession(newSession(players, config));
      setSetup(false);
    }
  }
  function connect(create: boolean) {
    if (!url.trim() || !name.trim()) {
      setError("Enter a server URL and your name.");
      return;
    }
    if (!/^https?:\/\//.test(url)) {
      setError("Use a full http:// or https:// server URL.");
      return;
    }
    socket.current?.disconnect();
    const sock = io(url, { timeout: 7000, reconnection: true });
    socket.current = sock;
    setError("Connecting…");
    sock.on("connect", () => {
      setDisconnect(false);
      if (sock.recovered) return;
      sock.emit(
        create ? "create" : "join",
        { name, face, code },
        (res: any) => {
          if (res.error) setError(res.error);
          else {
            setRoomModal(false);
            setSetup(true);
            setError("");
          }
        },
      );
    });
    sock.on("room", (r: Room) => {
      setRoom(r);
      setSession(r.session);
    });
    sock.on("notice", setError);
    sock.on("disconnect", () => {
      setDisconnect(true);
      setRoom(null);
      setSession(null);
      setError(
        "Disconnected. Rejoin the room; an interrupted match returns to the lobby.",
      );
    });
    sock.on("connect_error", () =>
      setError("Could not reach that room server. Check its URL and network."),
    );
  }
  function score(n: number) {
    if (!session) return;
    if (room) {
      socket.current?.emit(
        "score",
        { value: n, sessionId: session.id, round: session.round },
        (res: any) => res.error && setError(res.error),
      );
    } else setSession(submit(session, session.players[session.turn].id, n));
  }
  function raceScore(values: Record<string, number>) {
    if (!session) return;
    if (room)
      socket.current?.emit(
        "raceScores",
        { sessionId: session.id, round: session.round, values },
        (res: any) => res.error && setError(res.error),
      );
    else setSession(submitRaceRound(session, values));
  }
  function reset() {
    if (room)
      socket.current?.emit(
        "reset",
        {},
        (res: any) => res.error && setError(res.error),
      );
    else setSession(null);
  }
  function record(p: Player) {
    if (recorded || !session) return;
    setLedger((old) => {
      const entry = old.find((x) => x.id === p.id || x.name === p.name);
      return entry
        ? old.map((x) => (x === entry ? { ...x, paid: x.paid + 1 } : x))
        : [...old, { ...p, paid: 1 }];
    });
    setRecorded(true);
    buzz(true);
  }
  const roster = room?.players || players,
    current = session?.players[session.turn],
    host = !room || room.host === socket.current?.id;
  function panel(children: React.ReactNode, onClose: () => void) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#351E2899",
            alignItems: "center",
            justifyContent: "center",
            padding: width < 360 ? 2 : 16,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 650,
              maxHeight: "94%",
              backgroundColor: C.paper,
              borderWidth: 2,
              borderColor: C.ink,
              borderRadius: 28,
              overflow: "hidden",
            }}
          >
            <ScrollView
              scrollEnabled={
                !(session?.phase === "playing" && roundGame(session) === "race")
              }
              contentContainerStyle={{
                padding: wide ? 30 : width < 360 ? 4 : 12,
                gap: 16,
              }}
            >
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <MusicButton music={music} />
                <Pressable
                  accessibilityLabel="Close dialog"
                  onPress={onClose}
                  style={{ alignSelf: "flex-end", padding: 8 }}
                >
                  <Text style={{ fontSize: 22, color: C.ink }}>✕</Text>
                </Pressable>
              </View>
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.paper,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={s.title}>funsplit✳</Text>
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: wide ? 54 : 20,
          paddingTop: Platform.OS === "web" ? 28 : 56,
          paddingBottom: 50,
          maxWidth: 1400,
          width: "100%",
          alignSelf: "center",
          gap: 30,
        }}
      >
        <View
          style={[
            s.row,
            {
              justifyContent: "space-between",
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderColor: C.ink,
            },
          ]}
        >
          <Pressable onPress={() => setTab("Arcade")}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "900",
                letterSpacing: -2,
                color: C.ink,
              }}
            >
              funsplit<Text style={{ color: C.orange }}>*</Text>
            </Text>
          </Pressable>
          <View style={s.row}>
            {["Arcade", "The crew", "Hall of shame"].map((t) => (
              <Chip key={t} active={tab === t} onPress={() => setTab(t)}>
                {t}
              </Chip>
            ))}
          </View>
          <MusicButton music={music} />
        </View>
        {!!music.error && <Text style={s.muted}>{music.error}</Text>}
        {!!error && (
          <Pressable
            onPress={() => setError("")}
            style={{ backgroundColor: C.blue, padding: 15, borderRadius: 12 }}
          >
            <Text style={s.body}>{error} ×</Text>
          </Pressable>
        )}
        {room && (
          <View style={[s.card, { backgroundColor: C.blue }]}>
            <Text style={s.eyebrow}>CONNECTED ROOM • {room.code}</Text>
            <Text style={s.body}>
              {room.players.map((p) => p.name).join(" + ")} ·{" "}
              {host ? "You’re the host" : "Waiting for your host"}
            </Text>
            <Button
              secondary
              onPress={() => {
                socket.current?.disconnect();
                setRoom(null);
                setSession(null);
                setError("");
              }}
            >
              Leave room
            </Button>
          </View>
        )}
        {tab === "Arcade" && (
          <>
            <View style={{ flexDirection: wide ? "row" : "column", gap: 20 }}>
              <View
                style={{
                  flex: 1.6,
                  backgroundColor: C.yellow,
                  borderRadius: 30,
                  borderWidth: 1.5,
                  borderColor: C.ink,
                  padding: wide ? 36 : 26,
                  overflow: "hidden",
                  minHeight: 330,
                }}
              >
                <View style={[s.row, { justifyContent: "space-between" }]}>
                  <Text style={s.eyebrow}>THE FRIENDSHIP STRESS TEST</Text>
                  <Text style={{ fontSize: 28 }}>→</Text>
                </View>
                <Text
                  style={[
                    s.title,
                    {
                      fontSize: wide ? 64 : 46,
                      lineHeight: wide ? 67 : 49,
                      marginTop: 15,
                      maxWidth: 480,
                    },
                  ]}
                >
                  Big decisions.{"\n"}Tiny games.
                </Text>
                <Text style={[s.body, { marginTop: 14, maxWidth: 350 }]}>
                  Who pays? Where to eat? What to watch? Let a little friendly
                  chaos decide.
                </Text>
                <View style={[s.row, { marginTop: 24 }]}>
                  <Button onPress={() => openSetup(config.game)}>
                    Let’s settle it →
                  </Button>
                  <View style={{ flexDirection: "row", marginLeft: 6 }}>
                    <View style={{ transform: [{ rotate: "-12deg" }] }}>
                      <Character animated size={55} color={C.orange} />
                    </View>
                    <View
                      style={{
                        marginLeft: -8,
                        transform: [{ rotate: "15deg" }],
                      }}
                    >
                      <Character
                        animated
                        size={55}
                        face="ghost"
                        color={C.blue}
                      />
                    </View>
                  </View>
                </View>
              </View>
              <View
                style={[
                  s.card,
                  {
                    flex: 1,
                    backgroundColor: C.blue,
                    justifyContent: "space-between",
                    padding: 28,
                  },
                ]}
              >
                <View style={[s.row, { justifyContent: "space-between" }]}>
                  <Text style={s.eyebrow}>ONE CREW. TWO WAYS TO PLAY.</Text>
                  <Text style={{ fontSize: 26 }}>☺</Text>
                </View>
                <Text style={[s.title, { fontSize: 30 }]}>
                  Pass it around.{"\n"}Or link up.
                </Text>
                <Text style={s.body}>
                  One phone for the whole table, or a room code for everyone’s
                  own screen. Zero accounts.
                </Text>
                <View style={{ gap: 10 }}>
                  <Button secondary onPress={() => openSetup(config.game)}>
                    ↔ Play on one phone
                  </Button>
                  <Pressable
                    onPress={() => {
                      setRoomModal(true);
                      setError("");
                    }}
                    style={{ padding: 10, alignItems: "center" }}
                  >
                    <Text style={{ fontWeight: "800", color: C.ink }}>
                      Connect our phones →
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
            <View
              style={[s.row, { justifyContent: "space-between", marginTop: 6 }]}
            >
              <View>
                <Text style={s.eyebrow}>PICK YOUR BATTLE</Text>
                <Text style={[s.title, { fontSize: 32, marginTop: 8 }]}>
                  Small games. Real stakes.
                </Text>
              </View>
              <Text style={s.muted}>
                7 games · 2–8 friends · endless “one more”
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              {games.map((g, i) => (
                <Pressable
                  key={g.id}
                  onPress={() => openSetup(g.id)}
                  style={({ hovered, pressed }: any) => ({
                    width: wide ? "23.8%" : width > 550 ? "48%" : "100%",
                    flexGrow: 1,
                    minWidth: wide ? 230 : 200,
                    borderWidth: 1.5,
                    borderColor: C.ink,
                    borderRadius: 23,
                    overflow: "hidden",
                    backgroundColor: C.paper,
                    transform: [{ translateY: hovered ? -4 : pressed ? 2 : 0 }],
                  })}
                >
                  <View
                    style={{
                      height: 155,
                      backgroundColor: g.color,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <GameArt id={g.id} />
                    <View
                      style={{
                        position: "absolute",
                        left: 14,
                        top: 14,
                        backgroundColor: C.paper,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 10,
                          color: C.ink,
                        }}
                      >
                        0{i + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        position: "absolute",
                        right: 17,
                        bottom: 12,
                        fontSize: 28,
                        color: C.ink,
                      }}
                    >
                      →
                    </Text>
                  </View>
                  <View style={{ padding: 20, gap: 7 }}>
                    <Text style={[s.eyebrow, { fontSize: 9 }]}>{g.tag}</Text>
                    <Text
                      style={{
                        fontSize: 23,
                        fontWeight: "900",
                        letterSpacing: -0.6,
                        color: C.ink,
                      }}
                    >
                      {g.name}
                    </Text>
                    <Text style={s.muted}>{g.description}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  setFocusPlayer(players[0].id);
                  setFocus(true);
                  setFocusDone(false);
                }}
                style={{
                  flexGrow: 1,
                  minWidth: wide ? 230 : 200,
                  width: wide ? "23.8%" : width > 550 ? "48%" : "100%",
                  backgroundColor: C.ink,
                  borderRadius: 23,
                  padding: 24,
                  gap: 15,
                  justifyContent: "space-between",
                }}
              >
                <Text style={[s.eyebrow, { color: C.yellow }]}>
                  LESS SCROLLING. MORE LIVING.
                </Text>
                <Text style={{ fontSize: 58, color: C.yellow }}>☾</Text>
                <Text style={[s.title, { fontSize: 27, color: C.paper }]}>
                  Screens down.{"\n"}Hang out.
                </Text>
                <Text style={{ color: C.paper, fontSize: 13, lineHeight: 20 }}>
                  Whoever checks out the most, checks out the bill. Try the
                  honesty-mode demo →
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                s.row,
                {
                  justifyContent: "space-between",
                  paddingTop: 15,
                  borderTopWidth: 1,
                  borderColor: C.sage,
                },
              ]}
            >
              <Text style={s.muted}>Made for the table, not the feed.</Text>
              <Text style={s.eyebrow}>LOSE THE GAME. KEEP THE FRIENDS. ✳</Text>
            </View>
          </>
        )}
        {tab === "The crew" && (
          <>
            <Text style={s.title}>Your usual suspects.</Text>
            <Text style={s.body}>
              Give everyone a name and a little personality. Saved on this
              device.
            </Text>
            {players.map((p, i) => (
              <View
                key={p.id}
                style={[
                  s.card,
                  {
                    flexDirection: wide ? "row" : "column",
                    alignItems: "center",
                  },
                ]}
              >
                <Character {...p} />
                <TextInput
                  accessibilityLabel={`Player ${i + 1} name`}
                  value={p.name}
                  maxLength={24}
                  onChangeText={(v) =>
                    setPlayers((ps) =>
                      ps.map((x) => (x.id === p.id ? { ...x, name: v } : x)),
                    )
                  }
                  style={[s.input, { flex: 1, minWidth: 160 }]}
                />
                <View style={s.row}>
                  {faces.map((f) => (
                    <Pressable
                      key={f}
                      accessibilityLabel={`${p.name} character ${f}`}
                      onPress={() =>
                        setPlayers((ps) =>
                          ps.map((x) =>
                            x.id === p.id ? { ...x, face: f } : x,
                          ),
                        )
                      }
                      style={{
                        borderWidth: p.face === f ? 2 : 0,
                        borderColor: C.ink,
                        borderRadius: 14,
                      }}
                    >
                      <Character face={f} color={p.color} size={45} />
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  disabled={players.length <= 2}
                  onPress={() =>
                    setPlayers((ps) => ps.filter((x) => x.id !== p.id))
                  }
                >
                  <Text style={s.muted}>Remove</Text>
                </Pressable>
              </View>
            ))}
            <Button
              disabled={players.length >= 8}
              onPress={() =>
                setPlayers((ps) => [
                  ...ps,
                  {
                    id: Math.random().toString(36).slice(2),
                    name: `Friend ${ps.length + 1}`,
                    face: faces[ps.length % 4],
                    color: [C.yellow, C.orange, C.blue, C.sage][ps.length % 4],
                  },
                ])
              }
            >
              + Add a friend ({players.length}/8)
            </Button>
          </>
        )}
        {tab === "Hall of shame" && (
          <>
            <Text style={s.eyebrow}>LOCAL LEGENDS</Text>
            <Text style={s.title}>Thanks for dinner.</Text>
            <Text style={s.body}>
              Payments confirmed on this device. A loss alone doesn’t count.
            </Text>
            {!ledger.length ? (
              <View style={s.card}>
                <Character face="ghost" color={C.blue} />
                <Text style={[s.title, { fontSize: 26 }]}>
                  Nobody’s picked up the tab. Yet.
                </Text>
                <Text style={s.muted}>
                  Play a round and confirm who actually paid.
                </Text>
                <Button
                  onPress={() => {
                    setTab("Arcade");
                    openSetup(config.game);
                  }}
                >
                  Start some trouble →
                </Button>
              </View>
            ) : (
              ledger
                .slice()
                .sort((a, b) => b.paid - a.paid)
                .map((p, i) => (
                  <View key={p.id} style={[s.card, s.row]}>
                    <Text style={s.eyebrow}>0{i + 1}</Text>
                    <Character {...p} size={55} />
                    <Text style={[s.body, { flex: 1, fontWeight: "800" }]}>
                      {p.name}
                    </Text>
                    <Text style={[s.title, { fontSize: 26 }]}>
                      {p.paid} paid
                    </Text>
                  </View>
                ))
            )}
          </>
        )}
      </ScrollView>
      {setup &&
        !session &&
        panel(
          <>
            <Text style={s.eyebrow}>
              {room ? `ROOM ${room.code}` : "PASS THE PHONE"}
            </Text>
            <Text style={s.title}>Settle the debate.</Text>
            <Text style={s.body}>
              {roster.map((p) => p.name || "Friend").join(" + ")}{" "}
              <Text
                onPress={() => {
                  setSetup(false);
                  setTab("The crew");
                }}
                style={{ textDecorationLine: "underline" }}
              >
                {" "}
                {room ? "" : "Edit crew"}
              </Text>
            </Text>
            <Text style={s.eyebrow}>WHAT’S AT STAKE?</Text>
            <View style={s.row}>
              {(["pay", "eat", "watch"] as const).map((p) => (
                <Chip
                  key={p}
                  active={config.purpose === p}
                  onPress={() =>
                    setConfig((v) => ({
                      ...v,
                      purpose: p,
                      options:
                        p === "watch"
                          ? ["Comedy", "Thriller", "Animation"]
                          : ["Pizza", "Sushi", "Tacos"],
                    }))
                  }
                >
                  {p === "pay"
                    ? "Who pays"
                    : p === "eat"
                      ? "Where to eat"
                      : "What to watch"}
                </Chip>
              ))}
            </View>
            {config.purpose !== "pay" && (
              <>
                <Text style={s.muted}>
                  The winner chooses from your shortlist. One choice per line.
                </Text>
                <TextInput
                  accessibilityLabel="Decision choices"
                  multiline
                  value={config.options.join("\n")}
                  onChangeText={(v) =>
                    setConfig((c) => ({
                      ...c,
                      options: v.split("\n").slice(0, 8),
                    }))
                  }
                  style={s.input}
                />
              </>
            )}
            <Text style={s.eyebrow}>OPENING GAME</Text>
            <View style={s.row}>
              {games.map((g) => (
                <Chip
                  key={g.id}
                  active={config.game === g.id}
                  onPress={() => setConfig((c) => ({ ...c, game: g.id }))}
                >
                  {g.icon} {g.name}
                </Chip>
              ))}
            </View>
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <View>
                <Text style={s.body}>Mix it up: tournament</Text>
                <Text style={s.muted}>
                  Off = repeat the same game each round
                </Text>
              </View>
              <Switch
                accessibilityLabel="Tournament"
                value={config.tournament}
                onValueChange={(v) =>
                  setConfig((c) => ({ ...c, tournament: v }))
                }
                trackColor={{ true: C.orange }}
              />
            </View>
            <View style={s.row}>
              {[1, 3, 5, 7].map((n) => (
                <Chip
                  key={n}
                  active={config.rounds === n}
                  onPress={() => setConfig((c) => ({ ...c, rounds: n }))}
                >
                  {n} {n === 1 ? "round" : "rounds"}
                </Chip>
              ))}
            </View>
            {!!error && <Text style={s.body}>{error}</Text>}
            <Button
              disabled={
                !host || roster.some((p) => !p.name.trim()) || roster.length < 2
              }
              onPress={start}
            >
              {host ? "Game faces on →" : "Waiting for the host…"}
            </Button>
            {room && (
              <Text style={s.muted}>
                Share room code {room.code}. Friends use the same server URL.
              </Text>
            )}
          </>,
          () => setSetup(false),
        )}
      {roomModal &&
        panel(
          <>
            <Text style={s.eyebrow}>EVERYONE’S INVITED</Text>
            <Text style={s.title}>Same crew. Own phones.</Text>
            <Text style={s.body}>
              Run the included room server, then enter its reachable URL. For
              phones on Wi-Fi use your computer’s LAN IP, not localhost.
            </Text>
            <TextInput
              accessibilityLabel="Room server URL"
              autoCapitalize="none"
              value={url}
              onChangeText={setUrl}
              placeholder="http://192.168.1.10:3001"
              style={s.input}
            />
            <TextInput
              accessibilityLabel="Your name"
              value={name}
              onChangeText={setName}
              maxLength={24}
              placeholder="Your name"
              style={s.input}
            />
            <View style={s.row}>
              {faces.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFace(f)}
                  style={{
                    borderWidth: face === f ? 2 : 0,
                    borderRadius: 14,
                    borderColor: C.ink,
                  }}
                >
                  <Character face={f} size={55} />
                </Pressable>
              ))}
            </View>
            <Button onPress={() => connect(true)}>Create a room →</Button>
            <TextInput
              accessibilityLabel="Room code"
              autoCapitalize="characters"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              placeholder="6-character room code"
              style={s.input}
            />
            <Button
              secondary
              disabled={code.length !== 6}
              onPress={() => connect(false)}
            >
              Join my friends →
            </Button>
            {!!error && <Text style={s.body}>{error}</Text>}
          </>,
          () => setRoomModal(false),
        )}
      {session &&
        panel(
          session.phase === "playing" ? (
            <>
              <Text style={s.eyebrow}>
                ROUND {session.round + 1}/{session.config.rounds} ·{" "}
                {roundGame(session) === "race"
                  ? "SHARED SCREEN"
                  : `PLAYER ${session.turn + 1}/${session.players.length}`}
              </Text>
              <Text style={[s.title, { fontSize: 30 }]}>
                {games.find((g) => g.id === roundGame(session))?.name}
              </Text>
              {roundGame(session) === "race" ? (
                host ? (
                  <Race
                    key={`${session.id}-${session.round}`}
                    players={session.players}
                    onDone={raceScore}
                  />
                ) : (
                  <View style={s.card}>
                    <Text style={s.title}>Race on the host’s phone.</Text>
                    <Text style={s.body}>
                      Two friends tap the same screen. Gather around the host to
                      play the bracket.
                    </Text>
                  </View>
                )
              ) : !room || current?.id === socket.current?.id ? (
                <Game
                  key={`${session.id}-${session.round}-${session.turn}`}
                  id={roundGame(session)}
                  player={current!}
                  round={session.round}
                  onDone={score}
                />
              ) : (
                <View style={{ gap: 20, alignItems: "center", padding: 30 }}>
                  <Character {...current} size={100} />
                  <Text style={s.title}>{current?.name} is up.</Text>
                  <Text style={s.body}>
                    Cheer them on. Your turn is coming.
                  </Text>
                </View>
              )}
              <Text style={s.muted}>
                {roundGame(session) === "race"
                  ? "Winner advances · tied heats go to sudden death."
                  : "Highest score wins. Lowest total rank points takes the bill. Ties are shared."}
              </Text>
              {!!error && <Text style={s.body}>{error}</Text>}
            </>
          ) : (
            <>
              <Burst />
              <Text style={s.eyebrow}>THE VERDICT IS IN</Text>
              <Animated.View
                style={{
                  alignItems: "center",
                  transform: [{ translateY: bounce }],
                }}
              >
                <Character {...losers(session)[0]} size={120} />
              </Animated.View>
              <Text style={s.title}>
                {session.config.purpose === "pay"
                  ? `${losers(session)
                      .map((p) => p.name)
                      .join(" & ")}, pay up.`
                  : `${winners(session)
                      .map((p) => p.name)
                      .join(" & ")}, you pick.`}
              </Text>
              <Text style={[s.body, { fontSize: 19 }]}>
                {session.config.purpose === "pay"
                  ? "Your gameplay was a donation to everyone else’s evening. Your wallet has been volunteered."
                  : "The group chat has finally reached a decision. Miracles happen."}
              </Text>
              {losers(session).length > 1 && (
                <Text style={s.muted}>
                  Tied at the bottom. Share the tab, agree who pays, or play a
                  rematch.
                </Text>
              )}
              {session.scores
                .filter((v) => v.game === "price")
                .filter(
                  (v, i, a) => a.findIndex((o) => o.round === v.round) === i,
                )
                .map((v) => (
                  <View key={v.round} style={{ gap: 6 }}>
                    <Text style={s.muted}>
                      Price reveal · {prices[v.round % prices.length].name}: $
                      {prices[v.round % prices.length].price.toLocaleString()}{" "}
                      USD · US retail before tax · 10 Nov 2026
                    </Text>
                    <Pressable
                      onPress={() =>
                        Linking.openURL(prices[v.round % prices.length].source)
                      }
                    >
                      <Text
                        style={[s.muted, { textDecorationLine: "underline" }]}
                      >
                        View official product source →
                      </Text>
                    </Pressable>
                  </View>
                ))}
              {standings(session).map((p, i) => (
                <View
                  key={p.id}
                  style={[
                    s.row,
                    {
                      paddingVertical: 9,
                      borderBottomWidth: 1,
                      borderColor: C.sage,
                    },
                  ]}
                >
                  <Text style={s.eyebrow}>#{i + 1}</Text>
                  <Character {...p} size={40} />
                  <Text style={[s.body, { flex: 1 }]}>{p.name}</Text>
                  <Text style={{ fontWeight: "900", color: C.ink }}>
                    {p.points} rank pts
                  </Text>
                </View>
              ))}
              {session.config.purpose === "pay" ? (
                <>
                  {!recorded &&
                    losers(session).map((p) => (
                      <Button key={p.id} onPress={() => record(p)}>
                        Confirm {p.name} paid ✓
                      </Button>
                    ))}
                  {recorded && (
                    <Text style={s.body}>
                      ✓ Payment added to this device’s Hall of shame.
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={s.muted}>
                    Winner’s choice. Tied winners agree together.
                  </Text>
                  <View style={s.row}>
                    {session.config.options.filter(Boolean).map((o) => (
                      <Chip
                        key={o}
                        active={tieChoice === o}
                        onPress={() => setTieChoice(o)}
                      >
                        {o}
                      </Chip>
                    ))}
                  </View>
                  {tieChoice && (
                    <Text style={[s.title, { fontSize: 27 }]}>
                      It’s settled: {tieChoice}!
                    </Text>
                  )}
                </>
              )}
              <Button
                secondary
                disabled={!host}
                onPress={() => {
                  reset();
                  setSetup(true);
                }}
              >
                Rematch / change game ↻
              </Button>
              <Button secondary disabled={!host} onPress={reset}>
                Back to arcade
              </Button>
            </>
          ),
          () => {
            if (host) reset();
            else setError("Only the host can end this match.");
          },
        )}
      {focus &&
        panel(
          <>
            <Text style={s.eyebrow}>SCREENS DOWN · HONESTY DEMO</Text>
            <Text style={s.title}>Be here. Not there.</Text>
            <Text style={s.body}>
              A shared-phone check-in tracker. Choose who’s using their phone
              and log seconds. On native, time away from this app is attributed
              to the selected person. This does not measure device-wide screen
              time.
            </Text>
            <Text style={[s.title, { fontSize: 55 }]}>
              {Math.floor(focusSeconds / 60)}:
              {String(focusSeconds % 60).padStart(2, "0")}
            </Text>
            {players.map((p) => (
              <View key={p.id} style={s.row}>
                <Chip
                  active={focusPlayer === p.id}
                  onPress={() => setFocusPlayer(p.id)}
                >
                  {p.name} · {usage[p.id] || 0}s
                </Chip>
                {focusRunning && (
                  <Button
                    secondary
                    onPress={() =>
                      setUsage((v) => ({ ...v, [p.id]: (v[p.id] || 0) + 30 }))
                    }
                  >
                    +30s
                  </Button>
                )}
              </View>
            ))}
            {!focusRunning && !focusDone ? (
              <Button
                onPress={() => {
                  setUsage({});
                  setFocusSeconds(0);
                  setFocusRunning(true);
                }}
              >
                Start hangout
              </Button>
            ) : focusRunning ? (
              <Button
                onPress={() => {
                  setFocusRunning(false);
                  setFocusDone(true);
                }}
              >
                End hangout →
              </Button>
            ) : (
              <>
                <Text style={[s.title, { fontSize: 26 }]}>
                  {Math.max(0, ...Object.values(usage)) === 0
                    ? "No check-ins. Everyone wins."
                    : `${players
                        .filter(
                          (p) =>
                            (usage[p.id] || 0) ===
                            Math.max(...Object.values(usage)),
                        )
                        .map((p) => p.name)
                        .join(" & ")} checked out the most.`}
                </Text>
                <Text style={s.muted}>
                  Agree on the tab together. This experimental mode does not
                  record a payment automatically.
                </Text>
                <Button secondary onPress={() => setFocusDone(false)}>
                  New hangout
                </Button>
              </>
            )}
          </>,
          () => {
            setFocus(false);
            setFocusRunning(false);
          },
        )}
    </View>
  );
}
