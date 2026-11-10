import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Circle, Line, G } from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Badge, Burst, Ready } from "./shared";
export type AimStage = "horizontal" | "vertical" | "flight" | "impact";
export default function Archery({
  player,
  onDone,
}: {
  player: Player;
  onDone: (n: number) => void;
}) {
  const compact = useWindowDimensions().height < 760;
  const [ready, setReady] = useState(false),
    [stage, setStage] = useState<AimStage>("horizontal"),
    [remaining, setRemaining] = useState(30),
    [cursor, setCursor] = useState({ x: 150, y: 135 }),
    [hits, setHits] = useState<{ x: number; y: number; score: number }[]>([]),
    [message, setMessage] = useState(""),
    [done, setDone] = useState(false),
    [total, setTotal] = useState(0);
  const state = useRef({
      stage: "horizontal" as AimStage,
      x: 150,
      y: 135,
      start: 0,
      phaseStart: 0,
      ended: false,
    }),
    flight = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!ready || done) return;
    const timer = setInterval(() => {
      const v = state.current,
        now = Date.now();
      if (v.stage === "flight" || v.stage === "impact") return;
      const left = Math.max(0, 30 - (now - v.start) / 1000);
      setRemaining(left);
      if (left === 0) {
        v.stage = "impact";
        setStage("impact");
        setMessage("Time’s up! This arrow scores 0.");
        setHits((h) => [...h, { x: v.x, y: v.y, score: 0 }]);
        return;
      }
      const travel = ((now - v.phaseStart) / 1000) * 1.35,
        position = (1 - Math.cos(travel)) * 120 + 30;
      if (v.stage === "horizontal") v.x = position;
      else v.y = position - 15;
      setCursor({ x: v.x, y: v.y });
    }, 16);
    return () => clearInterval(timer);
  }, [ready, done]);
  function begin() {
    state.current = {
      stage: "horizontal",
      x: 30,
      y: 135,
      start: Date.now(),
      phaseStart: Date.now(),
      ended: false,
    };
    setCursor({ x: 30, y: 135 });
    setStage("horizontal");
    setRemaining(30);
    setReady(true);
    setMessage("");
  }
  function aim() {
    const v = state.current;
    if (
      (v.stage === "horizontal" || v.stage === "vertical") &&
      Date.now() - v.start >= 30000
    ) {
      v.stage = "impact";
      setStage("impact");
      setRemaining(0);
      setMessage("Time’s up! This arrow scores 0.");
      setHits((h) => [...h, { x: v.x, y: v.y, score: 0 }]);
      return;
    }
    if (v.stage === "horizontal") {
      v.stage = "vertical";
      v.phaseStart = Date.now();
      v.y = 15;
      setStage("vertical");
      setCursor({ x: v.x, y: v.y });
      buzz();
    } else if (v.stage === "vertical") {
      v.stage = "flight";
      setStage("flight");
      flight.setValue(0);
      buzz();
      Animated.timing(flight, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        const points = Math.max(
          0,
          Math.round(100 - Math.hypot(v.x - 150, v.y - 135) * 0.8),
        );
        setHits((h) => [...h, { x: v.x, y: v.y, score: points }]);
        setTotal((n) => n + points);
        setMessage(
          points >= 90
            ? "BULLSEYE! Your wallet breathes again."
            : `${points} points. That’ll leave a mark.`,
        );
        v.stage = "impact";
        setStage("impact");
        buzz(true);
      });
    }
  }
  useEffect(() => () => flight.stopAnimation(), []);
  if (!ready)
    return (
      <Ready
        player={player}
        description="Three arrows. 30 seconds per arrow. Lock left–right aim, then top–bottom aim. Your second tap releases the arrow."
        onReady={<Button onPress={begin}>I’m ready. Let’s play →</Button>}
      />
    );
  return (
    <View style={{ gap: 14, alignItems: "center" }}>
      <View style={[s.row, { justifyContent: "space-between", width: "100%" }]}>
        <Badge color={remaining < 6 ? C.orange : C.yellow}>
          ARROW {Math.min(3, hits.length + (stage === "impact" ? 0 : 1))}/3
        </Badge>
        <Text
          accessibilityLabel="Shot timer"
          style={{ fontSize: 23, fontWeight: "900", color: C.ink }}
        >
          {Math.ceil(remaining)}s
        </Text>
        <Text style={s.eyebrow}>{total}/300 PTS</Text>
      </View>
      <View
        style={{
          height: 5,
          width: "100%",
          backgroundColor: C.sage,
          borderRadius: 3,
        }}
      >
        <View
          style={{
            height: 5,
            width: `${(remaining / 30) * 100}%`,
            backgroundColor: remaining < 6 ? C.orange : C.ink,
            borderRadius: 3,
          }}
        />
      </View>
      <View style={s.row}>
        <Badge color={stage === "horizontal" ? C.yellow : C.paper}>
          01 · LOCK X
        </Badge>
        <Badge color={stage === "vertical" ? C.yellow : C.paper}>
          02 · LOCK Y
        </Badge>
        <Badge
          color={stage === "flight" || stage === "impact" ? C.orange : C.paper}
        >
          03 · RELEASE
        </Badge>
      </View>
      <Pressable
        accessibilityLabel="Game arena"
        onPress={aim}
        disabled={done || stage === "flight" || stage === "impact"}
        style={{
          width: 300,
          height: compact ? 320 : 370,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 25,
          overflow: "hidden",
          backgroundColor: C.blue,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            width: 300,
            height: 370,
            transformOrigin: "top center",
            transform: [{ scale: compact ? 320 / 370 : 1 }],
          }}
        >
          <Svg width="300" height="370" viewBox="0 0 300 370">
            <Path
              d="M0 255 Q70 225 145 253 T300 240 L300 370 L0 370Z"
              fill={C.sage}
            />
            <Path
              d="M103 245 L81 299 M197 245 L218 299"
              stroke={C.ink}
              strokeWidth="6"
            />
            {[114, 92, 69, 46, 23].map((r, i) => (
              <Circle
                key={r}
                cx="150"
                cy="135"
                r={r}
                fill={[C.paper, C.ink, C.blue, C.orange, C.yellow][i]}
                stroke={C.ink}
                strokeWidth="1.5"
              />
            ))}
            <G opacity=".25" stroke={C.ink}>
              <Line x1="30" y1="135" x2="270" y2="135" strokeDasharray="3 5" />
              <Line x1="150" y1="15" x2="150" y2="255" strokeDasharray="3 5" />
            </G>
            {hits.map((h, i) => (
              <G key={i} stroke={C.ink} strokeWidth="2.5">
                <Path
                  d={`M${h.x - 7} ${h.y + 9} l14 -18 M${h.x + 2} ${h.y - 9} l5 0 l0 6`}
                />
              </G>
            ))}
            {!done && stage !== "impact" && stage !== "flight" && (
              <G stroke={C.ink} strokeWidth="2">
                <Line
                  x1={cursor.x}
                  y1="15"
                  x2={cursor.x}
                  y2="255"
                  strokeDasharray="5 4"
                  opacity={stage === "horizontal" ? 1 : 0.25}
                />
                {stage === "vertical" && (
                  <Line
                    x1="30"
                    y1={cursor.y}
                    x2="270"
                    y2={cursor.y}
                    strokeDasharray="5 4"
                  />
                )}
                <Circle cx={cursor.x} cy={cursor.y} r="9" fill="none" />
                <Line
                  x1={cursor.x - 15}
                  x2={cursor.x + 15}
                  y1={cursor.y}
                  y2={cursor.y}
                />
                <Line
                  x1={cursor.x}
                  x2={cursor.x}
                  y1={cursor.y - 15}
                  y2={cursor.y + 15}
                />
              </G>
            )}
            <Path
              d="M95 302 Q150 355 205 302"
              stroke={C.ink}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={
                stage === "flight" || stage === "impact"
                  ? "M95 302 L205 302"
                  : "M95 302 L150 350 L205 302"
              }
              stroke={C.ink}
              strokeWidth="2"
              fill="none"
            />
            <Path
              d="M143 330 L157 330 L157 345 L143 345Z"
              fill={C.orange}
              stroke={C.ink}
              strokeWidth="2"
            />
            {stage !== "flight" && stage !== "impact" && (
              <Path
                d="M150 347 L150 280 M144 289 L150 278 L156 289 M144 338 L150 344 L156 338"
                stroke={C.ink}
                strokeWidth="2.5"
                fill="none"
              />
            )}
          </Svg>
          {stage === "flight" && (
            <Animated.View
              style={{
                position: "absolute",
                left: 143,
                top: 280,
                transform: [
                  {
                    translateX: flight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, cursor.x - 150],
                    }),
                  },
                  {
                    translateY: flight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, cursor.y - 280],
                    }),
                  },
                  {
                    scale: flight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.4, 0.45],
                    }),
                  },
                ],
              }}
            >
              <Svg width="18" height="62">
                <Path
                  d="M9 60 L9 2 M2 12 L9 2 L16 12 M2 48 L9 56 L16 48"
                  stroke={C.ink}
                  strokeWidth="3"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          )}
          {stage === "impact" && (hits.at(-1)?.score ?? 0) >= 90 && <Burst />}
        </View>
      </Pressable>
      <Text style={[s.title, { fontSize: 22, textAlign: "center" }]}>
        {stage === "horizontal"
          ? "Tap to lock left–right"
          : stage === "vertical"
            ? "Tap to lock up–down & fire"
            : stage === "flight"
              ? "Let it fly…"
              : message}
      </Text>
      <View style={s.row}>
        {[0, 1, 2].map((i) => (
          <Badge key={i} color={hits[i] ? C.yellow : C.paper}>
            {hits[i] ? `${hits[i].score} PTS` : `ARROW ${i + 1}`}
          </Badge>
        ))}
      </View>
      {stage === "impact" &&
        (hits.length >= 3 ? (
          <Button onPress={() => onDone(total)}>
            Save score & pass it on →
          </Button>
        ) : (
          <Button onPress={begin}>Ready next arrow →</Button>
        ))}
    </View>
  );
}
