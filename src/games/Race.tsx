import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { type Player } from "../model";
import { createBracket, advanceBracket, bracketScores } from "../bracket";
import { Button, C, s, Character, buzz } from "../ui";
import { Badge, Burst } from "./shared";
const FINISH = 60;
export default function Race({
  players,
  onDone,
}: {
  players: Player[];
  onDone: (scores: Record<string, number>) => void;
}) {
  const compact = useWindowDimensions().height < 760;
  const [bracket, setBracket] = useState(() =>
      createBracket(players.map((p) => p.id)),
    ),
    [phase, setPhase] = useState<"ready" | "countdown" | "race" | "finish">(
      "ready",
    ),
    [count, setCount] = useState(3),
    [counts, setCounts] = useState<[number, number]>([0, 0]),
    [elapsed, setElapsed] = useState(0),
    [winner, setWinner] = useState<number | null>(null),
    [trackWidth, setTrackWidth] = useState(280),
    [sudden, setSudden] = useState(false);
  const state = useRef({
      phase: "ready",
      counts: [0, 0],
      start: 0,
      winner: null as number | null,
      sudden: false,
    }),
    move = [
      useRef(new Animated.Value(0)).current,
      useRef(new Animated.Value(0)).current,
    ];
  const pair = bracket.queue
    .slice(0, 2)
    .map((id) => players.find((p) => p.id === id)!);
  useEffect(() => {
    if (phase !== "countdown") return;
    setCount(3);
    let n = 3;
    const timer = setInterval(() => {
      n--;
      setCount(n);
      if (n === 0) {
        clearInterval(timer);
        state.current = {
          phase: "race",
          counts: [0, 0],
          start: Date.now(),
          winner: null,
          sudden: false,
        };
        setPhase("race");
      }
    }, 650);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== "race") return;
    const timer = setInterval(() => {
      const sec = (Date.now() - state.current.start) / 1000;
      setElapsed(sec);
      if (sec >= 20) {
        if (state.current.counts[0] === state.current.counts[1]) {
          state.current.sudden = true;
          setSudden(true);
        } else
          finish(state.current.counts[0] > state.current.counts[1] ? 0 : 1);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [phase]);
  function finish(i: number) {
    if (state.current.phase !== "race") return;
    state.current.phase = "finish";
    state.current.winner = i;
    setWinner(i);
    setPhase("finish");
    buzz(true);
    Animated.spring(move[i], {
      toValue: 1.08,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }
  function tap(i: number, n = 1) {
    const v = state.current;
    if (v.phase !== "race") return;
    v.counts[i] += n;
    setCounts([...v.counts] as [number, number]);
    Animated.timing(move[i], {
      toValue: Math.min(1, v.counts[i] / FINISH),
      duration: 100,
      useNativeDriver: true,
    }).start();
    if (v.counts[i] % 15 === 0) buzz();
    if (v.counts[i] >= FINISH || v.sudden) finish(i);
  }
  function begin() {
    state.current.phase = "countdown";
    state.current.counts = [0, 0];
    setCounts([0, 0]);
    setElapsed(0);
    setWinner(null);
    setSudden(false);
    move.forEach((v) => v.setValue(0));
    setPhase("countdown");
  }
  function next() {
    setBracket((b) =>
      advanceBracket(b, state.current.counts as [number, number]),
    );
    state.current.phase = "ready";
    setPhase("ready");
  }
  if (bracket.champion) {
    const champ = players.find((p) => p.id === bracket.champion)!;
    return (
      <View style={{ gap: 20, alignItems: "center", padding: 20 }}>
        <Burst />
        <Badge>BRACKET CHAMPION</Badge>
        <Character {...champ} animated size={150} />
        <Text style={[s.title, { fontSize: 32, textAlign: "center" }]}>
          Champion: {champ.name}
        </Text>
        <Text style={s.body}>Fast hands. Extremely smug face.</Text>
        <Button
          onPress={() =>
            onDone(
              bracketScores(
                bracket,
                players.map((p) => p.id),
              ),
            )
          }
        >
          Save tournament scores →
        </Button>
      </View>
    );
  }
  return (
    <View style={{ gap: 14, width: "100%" }}>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>
          {bracket.queue.length + bracket.next.length === 2
            ? "FINAL"
            : "KNOCKOUT"}{" "}
          · HEAT {bracket.heats.length + 1}
        </Badge>
        <Text style={s.eyebrow}>
          {phase === "race"
            ? sudden
              ? "SUDDEN DEATH"
              : `${Math.max(0, 20 - elapsed).toFixed(1)}s`
            : "FIRST TO 60 TAPS"}
        </Text>
      </View>
      <Text style={[s.title, { fontSize: 28, textAlign: "center" }]}>
        {pair[0].name} <Text style={{ color: C.orange }}>vs</Text>{" "}
        {pair[1].name}
      </Text>
      <View
        onLayout={(e) =>
          setTrackWidth(Math.max(140, e.nativeEvent.layout.width - 100))
        }
        style={{
          backgroundColor: C.blue,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 22,
          paddingTop: 25,
          paddingBottom: 8,
          overflow: "hidden",
        }}
      >
        <Text style={[s.eyebrow, { paddingHorizontal: 16, marginBottom: 12 }]}>
          THE BROKE GRAND PRIX
        </Text>
        {pair.map((p, i) => (
          <View
            key={p.id}
            style={{
              height: compact ? 54 : 78,
              borderTopWidth: 1.5,
              borderStyle: "dashed",
              borderColor: C.ink,
              justifyContent: "center",
            }}
          >
            {[0.25, 0.5, 0.75].map((f, j) => (
              <View
                key={f}
                style={{
                  position: "absolute",
                  left: 40 + trackWidth * f,
                  top: 0,
                  bottom: 0,
                  borderLeftWidth: 1,
                  borderStyle: "dashed",
                  borderColor: C.sage,
                }}
              >
                <Text style={{ fontSize: 8, color: C.ink, top: 3 }}>
                  CP{j + 1}
                </Text>
              </View>
            ))}
            <View
              style={{
                position: "absolute",
                left: 40 + trackWidth,
                top: 0,
                bottom: 0,
                width: 14,
                flexDirection: "row",
                flexWrap: "wrap",
              }}
            >
              {Array.from({ length: 16 }, (_, n) => (
                <View
                  key={n}
                  style={{
                    width: 7,
                    height: 11,
                    backgroundColor:
                      (n + Math.floor(n / 2)) % 2 ? C.paper : C.ink,
                  }}
                />
              ))}
            </View>
            <Animated.View
              style={{
                marginLeft: 10,
                alignSelf: "flex-start",
                transform: [
                  {
                    translateX: move[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, trackWidth],
                    }),
                  },
                  {
                    rotate:
                      phase === "race"
                        ? `${Math.sin(counts[i]) * 8}deg`
                        : "0deg",
                  },
                ],
              }}
            >
              <Character {...p} mood="determined" size={compact ? 43 : 58} />
            </Animated.View>
          </View>
        ))}
        <View style={[s.row, { justifyContent: "space-between", padding: 12 }]}>
          <Text style={s.eyebrow}>START</Text>
          <Text style={s.eyebrow}>FINISH ⚑</Text>
        </View>
        {phase === "countdown" && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#351E28CC",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 96, fontWeight: "900", color: C.yellow }}>
              {count || "GO!"}
            </Text>
          </View>
        )}
        {phase === "finish" && <Burst />}
      </View>
      {phase === "ready" ? (
        <>
          <Text style={[s.body, { textAlign: "center" }]}>
            One screen. Two sets of thumbs. Tap your own pad at the same time.
            Cross the finish line first; after 20s the leader wins.
          </Text>
          <Button onPress={begin}>Start this heat →</Button>
        </>
      ) : phase === "finish" ? (
        <View style={{ gap: 12 }}>
          <Text style={[s.title, { fontSize: 28, textAlign: "center" }]}>
            Heat winner: {pair[winner!].name}
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>
            {counts[0]} – {counts[1]} taps ·{" "}
            {bracket.queue.length + bracket.next.length === 2
              ? "The crown is yours."
              : "Winner advances. Pass the phone to the next pair."}
          </Text>
          <Button onPress={next}>Continue bracket →</Button>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {pair.map((p, i) => (
            <View
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Tap for ${p.name}`}
              {...(Platform.OS === "web"
                ? {
                    onPointerDown: (e: any) => {
                      e.preventDefault();
                      tap(i);
                    },
                    onKeyDown: (e: any) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        tap(i);
                      }
                    },
                    tabIndex: 0,
                  }
                : {
                    onTouchStart: (e: any) =>
                      tap(
                        i,
                        Math.max(1, e.nativeEvent.changedTouches?.length || 1),
                      ),
                  })}
              style={{
                flex: 1,
                backgroundColor: i ? C.orange : C.yellow,
                borderWidth: 2,
                borderColor: C.ink,
                borderRadius: 22,
                minHeight: compact ? 92 : 124,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                ...(Platform.OS === "web"
                  ? ({ touchAction: "none", userSelect: "none" } as any)
                  : {}),
              }}
            >
              <Text style={[s.eyebrow, { textAlign: "center" }]}>{p.name}</Text>
              <Text style={{ fontSize: 34, fontWeight: "900", color: C.ink }}>
                {counts[i]}
              </Text>
              <Text style={s.eyebrow}>TAP TAP!</Text>
              <Text style={{ fontSize: 10, color: C.ink }}>
                CP {Math.min(3, Math.floor(counts[i] / 15))}/3
              </Text>
            </View>
          ))}
        </View>
      )}
      {bracket.heats.length > 0 && (
        <View style={[s.card, { padding: 12, gap: 5 }]}>
          <Text style={s.eyebrow}>ROAD TO THE FINAL</Text>
          {bracket.heats.map((h, i) => (
            <Text key={i} style={s.muted}>
              {players.find((p) => p.id === h.a)?.name} {h.taps[0]} :{" "}
              {h.taps[1]} {players.find((p) => p.id === h.b)?.name} →{" "}
              {players.find((p) => p.id === h.winner)?.name}
            </Text>
          ))}
        </View>
      )}
      {bracket.byes.length > 0 && (
        <Text style={s.muted}>
          Automatic advance:{" "}
          {bracket.byes
            .map((id) => players.find((p) => p.id === id)?.name)
            .join(", ")}
        </Text>
      )}
    </View>
  );
}
