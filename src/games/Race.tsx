import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";
import { Backdrop } from "../render/Backdrop";
import Sprite from "../render/Sprite";
import { Counter, Particles, StateCard, Achievement } from "../render/fx";
import { useSfx } from "../render/sound";
import Reward from "../render/Reward";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Platform, useWindowDimensions } from "react-native";
import { type Player } from "../model";
import { createBracket, advanceBracket, bracketScores } from "../bracket";
import { Button, C, s, Character, buzz } from "../ui";
import { Badge, Burst } from "./shared";
import { consumeRaceTouchStarts, releaseRaceTouches } from "../raceTouches";
const FINISH = 60;
export default function Race({
  players,
  onDone,
}: {
  players: Player[];
  onDone: (scores: Record<string, number>) => void;
}) {
  const sound = useSfx();
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
    [padWidth, setPadWidth] = useState(300),
    [sudden, setSudden] = useState(false);
  const state = useRef({
      phase: "ready",
      counts: [0, 0],
      start: 0,
      winner: null as number | null,
      sudden: false,
      lastHud: -1,
    }),
    move = [useSharedValue(0), useSharedValue(0)],
    activeTouches = useRef(new Set<number>());
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
          lastHud: -1,
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
      const second = Math.floor(sec);
      if (state.current.lastHud !== second) {
        state.current.lastHud = second;
        setElapsed(second);
      }
      if (sec >= 20) {
        if (state.current.counts[0] === state.current.counts[1]) {
          if (!state.current.sudden) {
            state.current.sudden = true;
            setSudden(true);
          }
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
    move[i].value = withSpring(1.08, { damping: 9, stiffness: 150 });
    sound("reward");
  }
  function tap(i: number, n = 1) {
    const v = state.current;
    if (v.phase !== "race") return;
    v.counts[i] += n;
    setCounts([...v.counts] as [number, number]);
    move[i].value = withTiming(Math.min(1, v.counts[i] / FINISH), {
      duration: 100,
    });
    sound(v.counts[i] % 15 === 0 ? "reward" : "tap");
    if (v.counts[i] % 15 === 0) buzz();
    if (v.counts[i] >= FINISH || v.sudden) finish(i);
  }
  function begin() {
    activeTouches.current.clear();
    state.current.phase = "countdown";
    state.current.counts = [0, 0];
    setCounts([0, 0]);
    setElapsed(0);
    setWinner(null);
    setSudden(false);
    move.forEach((v) => {
      v.value = 0;
    });
    sound("whoosh");
    setPhase("countdown");
  }
  function nativeTouchStart(e: any) {
    for (const lane of consumeRaceTouchStarts(
      e.nativeEvent.changedTouches || [],
      padWidth,
      activeTouches.current,
    ))
      tap(lane);
  }
  function nativeTouchEnd(e: any) {
    releaseRaceTouches(
      e.nativeEvent.changedTouches || [],
      activeTouches.current,
    );
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
        <Reward />
        <Sprite {...champ} state="winning" size={130} />
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
        testID="scene-race"
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
        <Backdrop theme="stadium" height={260} />
        <Text
          style={[
            s.eyebrow,
            { paddingHorizontal: 16, marginBottom: 12, color: C.paper },
          ]}
        >
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
              backgroundColor: i === 0 ? "#A9C4D477" : "#A0B3AA77",
            }}
          >
            {[0.25, 0.5, 0.75].map((f, j) => (
              <Checkpoint
                key={f}
                move={move[i]}
                fraction={f}
                left={40 + trackWidth * f}
                label={j + 1}
              />
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
            <Runner
              player={p}
              move={move[i]}
              trackWidth={trackWidth}
              state={
                phase === "finish"
                  ? winner === i
                    ? "winning"
                    : "losing"
                  : phase === "race"
                    ? "moving"
                    : "idle"
              }
              size={compact ? 43 : 58}
            />
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
        <View
          onLayout={(e) => setPadWidth(e.nativeEvent.layout.width)}
          {...(Platform.OS === "web"
            ? {}
            : {
                onTouchStart: nativeTouchStart,
                onTouchEnd: nativeTouchEnd,
                onTouchCancel: nativeTouchEnd,
              })}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 18,
            width: "100%",
            paddingHorizontal: 2,
          }}
        >
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
                : { pointerEvents: "none" as const })}
              style={{
                width: "46%",
                backgroundColor: i ? C.orange : C.yellow,
                borderWidth: 2,
                borderColor: C.ink,
                borderRadius: 22,
                minHeight: compact ? 104 : 138,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                shadowColor: C.ink,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 0,
                ...(Platform.OS === "web"
                  ? ({ touchAction: "none", userSelect: "none" } as any)
                  : {}),
              }}
            >
              <TapRipple count={counts[i]} />
              <Text style={[s.eyebrow, { textAlign: "center" }]}>{p.name}</Text>
              <Counter value={counts[i]} size={34} />
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

function Runner({ player, move, trackWidth, state, size }: any) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: move.value * trackWidth }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ marginLeft: 10, alignSelf: "flex-start" }, style]}
    >
      {state === "moving" && (
        <View style={{ position: "absolute", left: -15, top: 22, gap: 5 }}>
          {[15, 10, 18].map((w, i) => (
            <View
              key={i}
              style={{
                width: w,
                height: 2,
                backgroundColor: "#FFF4CB",
                opacity: 0.7,
              }}
            />
          ))}
        </View>
      )}
      <Sprite {...player} state={state} size={size} />
    </Animated.View>
  );
}
function TapRipple({ count }: any) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withTiming(1, { duration: 240 });
    return () => cancelAnimation(p);
  }, [count]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - p.value) * 0.22,
    transform: [{ scale: 0.4 + p.value * 1.2 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "#FFF",
        },
        style,
      ]}
    />
  );
}

function Checkpoint({ move, fraction, left, label }: any) {
  const pulse = useSharedValue(0);
  useAnimatedReaction(
    () => move.value >= fraction,
    (crossed, prev) => {
      if (crossed && !prev)
        pulse.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 450 }),
        );
    },
  );
  const style = useAnimatedStyle(() => ({
    opacity: move.value >= fraction ? 0.9 : 0.45,
    backgroundColor: `rgba(233,240,86,${pulse.value * 0.5})`,
    transform: [{ scaleX: 1 + pulse.value * 3 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left,
          top: 0,
          bottom: 0,
          width: 4,
          borderLeftWidth: 1,
          borderStyle: "dashed",
          borderColor: C.paper,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 8, color: C.paper, top: 3, width: 20 }}>
        CP{label}
      </Text>
    </Animated.View>
  );
}
