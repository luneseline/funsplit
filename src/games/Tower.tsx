import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Badge, Burst, Ready } from "./shared";
export function overlap(base: { x: number; w: number }, x: number) {
  const left = Math.max(base.x, x),
    right = Math.min(base.x + base.w, x + base.w);
  return { x: left, w: Math.max(0, right - left) };
}
export default function Tower({
  player,
  onDone,
}: {
  player: Player;
  onDone: (n: number) => void;
}) {
  const [started, setStarted] = useState(false),
    [done, setDone] = useState(false),
    [blocks, setBlocks] = useState([{ x: 70, w: 160 }]),
    [remaining, setRemaining] = useState(30),
    [message, setMessage] = useState("Find your rhythm."),
    [falling, setFalling] = useState(false),
    [perfect, setPerfect] = useState(false),
    [debris, setDebris] = useState<{ x: number; w: number } | null>(null),
    [pos, setPos] = useState(70);
  const state = useRef({ phase: "ready", start: 0, moveStart: 0, x: 70 }),
    drop = useRef(new Animated.Value(0)).current,
    shake = useRef(new Animated.Value(0)).current,
    offcut = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!started || done) return;
    const timer = setInterval(() => {
      const v = state.current,
        left = Math.max(0, 30 - (Date.now() - v.start) / 1000);
      setRemaining(left);
      if (left === 0 && v.phase !== "fall") {
        v.phase = "done";
        setDone(true);
        setMessage("Time! Let’s measure that masterpiece.");
        return;
      }
      if (v.phase === "move") {
        const x =
          ((1 +
            Math.sin(
              ((Date.now() - v.moveStart) / 1000) * (2 + blocks.length * 0.12),
            )) *
            (300 - blocks.at(-1)!.w)) /
          2;
        v.x = x;
        setPos(x);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, done, blocks.length]);
  useEffect(
    () => () => {
      drop.stopAnimation();
      shake.stopAnimation();
      offcut.stopAnimation();
    },
    [],
  );
  function begin() {
    state.current = {
      phase: "move",
      start: Date.now(),
      moveStart: Date.now(),
      x: 70,
    };
    setStarted(true);
  }
  function place() {
    const v = state.current;
    if (v.phase !== "move") return;
    v.phase = "fall";
    setFalling(true);
    setPerfect(false);
    setDebris(null);
    drop.setValue(0);
    const base = blocks.at(-1)!,
      x = v.x,
      landing = overlap(base, x),
      isPerfect = Math.abs(x - base.x) < 7;
    Animated.timing(drop, {
      toValue: 1,
      duration: 450,
      easing: (t) => t * t,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      buzz();
      setFalling(false);
      if (landing.w < 8) {
        v.phase = "done";
        setDone(true);
        setMessage("A spectacular structural disagreement.");
        return;
      }
      const next = isPerfect ? { ...base } : landing;
      setBlocks((bs) => [...bs, next]);
      setPerfect(isPerfect);
      setMessage(
        isPerfect
          ? "PERFECT! Full width. Chef’s kiss."
          : `${Math.round((next.w / base.w) * 100)}% overlap · keep it together.`,
      );
      if (!isPerfect) {
        const cut =
          x < base.x
            ? { x, w: landing.x - x }
            : {
                x: landing.x + landing.w,
                w: x + base.w - landing.x - landing.w,
              };
        setDebris(cut);
        offcut.setValue(0);
        Animated.timing(offcut, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start();
      }
      shake.setValue(1);
      Animated.spring(shake, {
        toValue: 0,
        friction: 3,
        useNativeDriver: true,
      }).start();
      if (blocks.length >= 12) {
        v.phase = "done";
        setDone(true);
        setMessage("12 FLOORS. The skyline is officially yours.");
        buzz(true);
      } else {
        v.phase = "move";
        v.moveStart = Date.now();
      }
    });
  }
  const bottom = 330 - blocks.length * 21,
    activeW = blocks.at(-1)!.w;
  if (!started)
    return (
      <Ready
        player={player}
        description="A block cruises across the skyline. Tap to drop it from the crane. Land with maximum overlap; a perfect drop keeps its full width. 30 seconds, 12 floors."
        onReady={<Button onPress={begin}>I’m ready. Let’s play →</Button>}
      />
    );
  return (
    <View style={{ gap: 14, alignItems: "center" }}>
      <View style={[s.row, { justifyContent: "space-between", width: "100%" }]}>
        <Badge>{blocks.length - 1} FLOORS</Badge>
        <Text style={[s.eyebrow, { color: remaining < 6 ? C.orange : C.ink }]}>
          {Math.ceil(remaining)}s LEFT
        </Text>
        <Badge color={C.blue}>BEST ALIGNMENT WINS</Badge>
      </View>
      <Pressable
        accessibilityLabel="Game arena"
        disabled={done || falling}
        onPress={place}
        style={{
          width: 300,
          height: 380,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 24,
          backgroundColor: C.blue,
          overflow: "hidden",
        }}
      >
        <Svg width="300" height="380" style={{ position: "absolute" }}>
          <Path
            d="M0 300 L0 260 L25 260 L25 235 L58 235 L58 280 L90 280 L90 250 L115 250 L115 300 M205 300 L205 265 L238 265 L238 240 L263 240 L263 270 L300 270 L300 300"
            fill={C.sage}
            opacity=".5"
          />
          <Path
            d="M30 0 L30 48 L270 48 L270 0 M20 38 L280 38 M70 38 L95 48 L120 38 L145 48 L170 38 L195 48 L220 38"
            fill="none"
            stroke={C.ink}
            strokeWidth="2"
          />
          <Line
            x1={pos + activeW / 2}
            y1="48"
            x2={pos + activeW / 2}
            y2="67"
            stroke={C.ink}
            strokeWidth="2"
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: 355,
            left: 0,
            right: 0,
            height: 45,
            backgroundColor: C.sage,
            borderTopWidth: 3,
            borderColor: C.ink,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            inset: 0,
            transform: [
              {
                translateX: shake.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 3],
                }),
              },
            ],
          }}
        >
          {blocks.map((b, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                top: 330 - i * 21,
                left: b.x,
                width: b.w,
                height: 23,
                borderWidth: 1.5,
                borderColor: C.ink,
                borderRadius: 4,
                backgroundColor: i % 2 ? C.orange : C.yellow,
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              {Array.from({ length: Math.floor(b.w / 25) }, (_, j) => (
                <View
                  key={j}
                  style={{
                    width: 9,
                    height: 10,
                    borderWidth: 1,
                    borderColor: C.ink,
                    backgroundColor: C.paper,
                    opacity: 0.6,
                  }}
                />
              ))}
            </View>
          ))}
        </Animated.View>
        {!done && (
          <Animated.View
            testID="falling-block"
            style={{
              position: "absolute",
              left: pos,
              top: 67,
              width: activeW,
              height: 23,
              borderWidth: 2,
              borderColor: C.ink,
              backgroundColor: C.orange,
              borderRadius: 5,
              transform: [
                {
                  translateY: falling
                    ? drop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.max(0, bottom - 67)],
                      })
                    : 0,
                },
              ],
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: "900",
                color: C.ink,
              }}
            >
              DROP ME
            </Text>
          </Animated.View>
        )}
        {debris && (
          <Animated.View
            style={{
              position: "absolute",
              left: debris.x,
              top: 330 - (blocks.length - 1) * 21,
              width: debris.w,
              height: 23,
              backgroundColor: C.orange,
              borderWidth: 1,
              borderColor: C.ink,
              opacity: offcut.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateY: offcut.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200],
                  }),
                },
                {
                  rotate: offcut.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "90deg"],
                  }),
                },
              ],
            }}
          />
        )}
        {perfect && <Burst />}
        <Text
          style={[
            s.eyebrow,
            { position: "absolute", bottom: 5, alignSelf: "center" },
          ]}
        >
          FUNSPLIT CONSTRUCTION CO.
        </Text>
      </Pressable>
      <Text style={[s.body, { fontWeight: "800", textAlign: "center" }]}>
        {message}
      </Text>
      {done ? (
        <Button onPress={() => onDone(blocks.length - 1)}>
          Save score & pass it on →
        </Button>
      ) : (
        <Button disabled={falling} onPress={place}>
          {falling ? "Incoming…" : "Drop block ↓"}
        </Button>
      )}
    </View>
  );
}
