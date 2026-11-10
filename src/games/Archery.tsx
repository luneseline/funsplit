import { svgMatrixProps } from "../render/svgTransform";
import { translateSvg } from "../render/svgTransformMath";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useFrameCallback,
  runOnUI,
  runOnJS,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Backdrop } from "../render/Backdrop";
import {
  Counter,
  Meter,
  Particles,
  Achievement,
  StateCard,
  useImpact,
} from "../render/fx";
import { arrowAim, arrowPoints } from "../render/physics";
import { useSfx } from "../render/sound";
import Reward from "../render/Reward";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Badge, Burst, Ready } from "./shared";
const APath = Animated.createAnimatedComponent(Path),
  AG = Animated.createAnimatedComponent(G),
  ALine = Animated.createAnimatedComponent(Line);
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
    [hits, setHits] = useState<{ x: number; y: number; score: number }[]>([]),
    [message, setMessage] = useState(""),
    [done, setDone] = useState(false),
    [total, setTotal] = useState(0);
  const ax = useSharedValue(30),
    ay = useSharedValue(135),
    phase = useSharedValue(0),
    startTime = useSharedValue(0),
    phaseStart = useSharedValue(0),
    flight = useSharedValue(0),
    progress = useSharedValue(1);
  const sound = useSfx(),
    impact = useImpact();
  function expire(x: number, y: number) {
    setStage("impact");
    setRemaining(0);
    setMessage("Time’s up! This arrow scores 0.");
    setHits((h) => [...h, { x, y, score: 0 }]);
    sound("fail");
  }
  const frame = useFrameCallback(() => {
    if (phase.value !== 1 && phase.value !== 2) return;
    const now = Date.now();
    progress.value = Math.max(0, 1 - (now - startTime.value) / 30000);
    if (now - startTime.value >= 30000) {
      phase.value = 4;
      runOnJS(expire)(ax.value, ay.value);
      return;
    }
    const p = arrowAim(now - phaseStart.value);
    if (phase.value === 1) ax.value = p;
    else ay.value = p - 15;
  }, false);
  useEffect(() => {
    frame.setActive(ready && (stage === "horizontal" || stage === "vertical"));
    if (!ready || stage === "flight" || stage === "impact") return;
    const timer = setInterval(
      () =>
        setRemaining(
          Math.max(0, Math.ceil(30 - (Date.now() - startTime.value) / 1000)),
        ),
      250,
    );
    return () => {
      clearInterval(timer);
      frame.setActive(false);
    };
  }, [ready, stage]);
  useEffect(() => () => cancelAnimation(flight), []);
  function begin() {
    const now = Date.now();
    ax.value = 30;
    ay.value = 135;
    phase.value = 1;
    startTime.value = now;
    phaseStart.value = now;
    progress.value = 1;
    flight.value = 0;
    setStage("horizontal");
    setRemaining(30);
    setReady(true);
    setMessage("");
  }
  function lockX() {
    setStage("vertical");
    sound("tick");
    buzz();
  }
  function hit(x: number, y: number) {
    const points = arrowPoints(x, y);
    setHits((h) => [...h, { x, y, score: points }]);
    setTotal((n) => n + points);
    setMessage(
      points >= 90
        ? "BULLSEYE! Your wallet breathes again."
        : `${points} points. That’ll leave a mark.`,
    );
    phase.value = 4;
    setStage("impact");
    impact.hit(points >= 90 ? 5 : 2);
    sound(points >= 90 ? "reward" : "impact");
    buzz(true);
  }
  function shoot(x: number, y: number) {
    setStage("flight");
    sound("whoosh");
    buzz();
    flight.value = 0;
    flight.value = withTiming(
      1,
      { duration: 650, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(hit)(x, y);
      },
    );
  }
  function aim() {
    runOnUI(() => {
      "worklet";
      if (phase.value !== 1 && phase.value !== 2) return;
      const now = Date.now();
      if (now - startTime.value >= 30000) {
        phase.value = 4;
        runOnJS(expire)(ax.value, ay.value);
        return;
      }
      if (phase.value === 1) {
        ax.value = arrowAim(now - phaseStart.value);
        phase.value = 2;
        phaseStart.value = now;
        ay.value = 15;
        runOnJS(lockX)();
      } else {
        ay.value = arrowAim(now - phaseStart.value) - 15;
        phase.value = 3;
        runOnJS(shoot)(ax.value, ay.value);
      }
    })();
  }
  const crossProps = useAnimatedProps(() =>
      svgMatrixProps(translateSvg(ax.value, ay.value)),
    ),
    xProps = useAnimatedProps(() => ({ x1: ax.value, x2: ax.value })),
    yProps = useAnimatedProps(() => ({ y1: ay.value, y2: ay.value }));
  const bowProps = useAnimatedProps(() => ({
    d: `M95 302 L150 ${302 + 48 * (phase.value === 3 || phase.value === 4 ? 1 - flight.value : 1)} L205 302`,
  }));
  const flightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: flight.value * (ax.value - 150) },
      { translateY: flight.value * (ay.value - 280) },
      { scale: 1.4 - flight.value * 0.95 },
    ],
  }));
  if (!ready)
    return (
      <Ready
        player={player}
        description="Three arrows. 30 seconds per arrow. Lock left–right aim, then top–bottom aim. Your second tap releases the arrow."
        onReady={<Button onPress={begin}>I’m ready. Let’s play →</Button>}
      />
    );
  return (
    <StateCard>
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
        <Counter value={total} label="/300 PTS" size={12} />
      </View>
      <Meter progress={progress} />
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
      <Animated.View style={[{ alignSelf: "center" }, impact.style]}>
        <Pressable
          testID="scene-archery"
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
            <Backdrop theme="range" height={370} />
            <Svg
              testID="archery-art"
              width="300"
              height="370"
              viewBox="0 0 300 370"
              style={{ position: "absolute", left: 0, top: 0 }}
            >
              <Defs>
                <RadialGradient id="target-light" cx=".35" cy=".25">
                  <Stop stopColor="#FFF" stopOpacity=".35" />
                  <Stop offset=".7" stopColor="#FFF" stopOpacity="0" />
                  <Stop offset="1" stopColor="#351E28" stopOpacity=".25" />
                </RadialGradient>
              </Defs>
              <Ellipse
                cx="153"
                cy="290"
                rx="77"
                ry="10"
                fill="#183B33"
                opacity=".25"
              />
              <Circle cx="154" cy="142" r="116" fill="#5A493E" />
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
              <Circle cx="150" cy="135" r="114" fill="url(#target-light)" />
              <Circle
                cx="150"
                cy="135"
                r="109"
                fill="none"
                stroke="#FFF"
                strokeWidth="2"
                opacity=".3"
              />
              <G opacity=".25" stroke={C.ink}>
                <Line
                  x1="30"
                  y1="135"
                  x2="270"
                  y2="135"
                  strokeDasharray="3 5"
                />
                <Line
                  x1="150"
                  y1="15"
                  x2="150"
                  y2="255"
                  strokeDasharray="3 5"
                />
              </G>
              {hits.map((h, i) => (
                <G key={i} stroke={C.ink} strokeWidth="2.5">
                  <Path
                    d={`M${h.x - 7} ${h.y + 9} l14 -18 M${h.x + 2} ${h.y - 9} l5 0 l0 6`}
                  />
                </G>
              ))}
              {stage !== "impact" && stage !== "flight" && (
                <G stroke={C.ink} strokeWidth="1.5">
                  <ALine
                    animatedProps={xProps}
                    y1="15"
                    y2="255"
                    strokeDasharray="4 5"
                    opacity={stage === "horizontal" ? 1 : 0.3}
                  />
                  {stage === "vertical" && (
                    <ALine
                      animatedProps={yProps}
                      x1="30"
                      x2="270"
                      strokeDasharray="4 5"
                    />
                  )}
                  <AG testID="aim-crosshair" animatedProps={crossProps}>
                    <Circle r="13" fill="#FFF" opacity=".3" />
                    <Circle
                      r="9"
                      fill="none"
                      stroke="#FF5C34"
                      strokeWidth="2"
                    />
                    <Path
                      d="M-17 0 L17 0 M0 -17 L0 17"
                      stroke="#351E28"
                      strokeWidth="1.5"
                    />
                  </AG>
                </G>
              )}
              <Path
                d="M95 302 Q150 355 205 302"
                stroke={C.ink}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
              <APath
                animatedProps={bowProps}
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
                style={[
                  { position: "absolute", left: 143, top: 280 },
                  flightStyle,
                ]}
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
            <Particles
              event={hits.length}
              x={hits.at(-1)?.x || 150}
              y={hits.at(-1)?.y || 135}
              color={C.orange}
            />
            {stage === "flight" && (
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    left: 147,
                    top: 315,
                    width: 4,
                    height: 55,
                    borderRadius: 4,
                    backgroundColor: "#FFF8CF",
                    opacity: 0.5,
                  },
                  flightStyle,
                ]}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
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
      {stage === "impact" && (hits.at(-1)?.score ?? 0) >= 90 && (
        <Achievement>BULLSEYE</Achievement>
      )}
      {stage === "impact" &&
        (hits.length >= 3 ? (
          <Button onPress={() => onDone(total)}>
            Save score & pass it on →
          </Button>
        ) : (
          <Button onPress={begin}>Ready next arrow →</Button>
        ))}
    </StateCard>
  );
}
