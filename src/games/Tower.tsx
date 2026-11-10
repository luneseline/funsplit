import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useFrameCallback,
  runOnJS,
  runOnUI,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Line,
  Path,
} from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Badge, Ready } from "./shared";
import { Backdrop } from "../render/Backdrop";
import { towerAim, overlap } from "../render/physics";
import {
  Counter,
  Meter,
  Particles,
  Achievement,
  StateCard,
  useImpact,
} from "../render/fx";
import { useSfx } from "../render/sound";
import Reward from "../render/Reward";
export { overlap } from "../render/physics";
const ALine = Animated.createAnimatedComponent(Line);
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
    [event, setEvent] = useState(0);
  const list = useRef(blocks),
    mode = useSharedValue("ready"),
    startTime = useSharedValue(0),
    moveStart = useSharedValue(0),
    x = useSharedValue(70),
    width = useSharedValue(160),
    level = useSharedValue(1),
    drop = useSharedValue(0),
    offcut = useSharedValue(0),
    squash = useSharedValue(1),
    progress = useSharedValue(1);
  const impact = useImpact(),
    sound = useSfx();
  function expire() {
    setDone(true);
    setMessage("Time! Let’s measure that masterpiece.");
    sound("fail");
  }
  const frame = useFrameCallback(() => {
    const now = Date.now();
    progress.value = Math.max(0, 1 - (now - startTime.value) / 30000);
    if (mode.value === "move") {
      if (now - startTime.value >= 30000) {
        mode.value = "done";
        runOnJS(expire)();
        return;
      }
      x.value = towerAim(now - moveStart.value, level.value, width.value);
    }
  }, false);
  useEffect(() => {
    frame.setActive(started && !done);
    if (!started || done) return;
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
  }, [started, done]);
  useEffect(
    () => () => {
      cancelAnimation(drop);
      cancelAnimation(offcut);
      cancelAnimation(squash);
    },
    [],
  );
  function begin() {
    const now = Date.now();
    mode.value = "move";
    startTime.value = now;
    moveStart.value = now;
    setStarted(true);
  }
  function resolve(px: number) {
    const base = list.current.at(-1)!,
      landing = overlap(base, px),
      isPerfect = Math.abs(px - base.x) < 7;
    setFalling(false);
    setEvent((n) => n + 1);
    impact.hit(isPerfect ? 2 : 4);
    sound(landing.w < 8 ? "fail" : isPerfect ? "reward" : "impact");
    buzz();
    if (landing.w < 8) {
      mode.value = "done";
      setDone(true);
      setMessage("A spectacular structural disagreement.");
      return;
    }
    const next = isPerfect ? { ...base } : landing,
      all = [...list.current, next];
    list.current = all;
    setBlocks(all);
    setPerfect(isPerfect);
    setMessage(
      isPerfect
        ? "PERFECT! Full width. Chef’s kiss."
        : `${Math.round((next.w / base.w) * 100)}% overlap · keep it together.`,
    );
    squash.value = withSequence(
      withTiming(0.96, { duration: 60 }),
      withSpring(1, { damping: 10 }),
    );
    if (!isPerfect) {
      setDebris(
        px < base.x
          ? { x: px, w: landing.x - px }
          : {
              x: landing.x + landing.w,
              w: px + base.w - landing.x - landing.w,
            },
      );
      offcut.value = 0;
      offcut.value = withTiming(1, { duration: 700 });
    }
    width.value = next.w;
    level.value = all.length;
    if (all.length >= 13) {
      mode.value = "done";
      setDone(true);
      setMessage("12 FLOORS. The skyline is officially yours.");
      buzz(true);
    } else {
      drop.value = 0;
      mode.value = "move";
      moveStart.value = Date.now();
    }
  }
  function beginDrop(px: number) {
    setFalling(true);
    setPerfect(false);
    setDebris(null);
    sound("whoosh");
    drop.value = 0;
    drop.value = withTiming(
      1,
      { duration: 450, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(resolve)(px);
      },
    );
  }
  function place() {
    runOnUI(() => {
      "worklet";
      if (mode.value !== "move") return;
      const px = towerAim(
        Date.now() - moveStart.value,
        level.value,
        width.value,
      );
      x.value = px;
      mode.value = "fall";
      runOnJS(beginDrop)(px);
    })();
  }
  const movingStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: x.value },
        { translateY: drop.value * Math.max(0, 330 - level.value * 21 - 67) },
        { rotate: `${Math.sin(drop.value * Math.PI) * 1.5}deg` },
      ],
    })),
    offcutStyle = useAnimatedStyle(() => ({
      opacity: 1 - offcut.value,
      transform: [
        { translateY: offcut.value * 200 },
        { rotate: `${offcut.value * 90}deg` },
      ],
    })),
    stackStyle = useAnimatedStyle(() => ({
      transform: [{ scaleY: squash.value }],
    })),
    rope = useAnimatedProps(() => ({
      x1: x.value + width.value / 2,
      x2: x.value + width.value / 2,
    }));
  if (!started)
    return (
      <Ready
        player={player}
        description="A block cruises across the skyline. Tap to drop it from the crane. Land with maximum overlap; a perfect drop keeps its full width. 30 seconds, 12 floors."
        onReady={<Button onPress={begin}>I’m ready. Let’s play →</Button>}
      />
    );
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Counter value={blocks.length - 1} label=" FLOORS" size={23} />
        <Badge>{remaining}s LEFT</Badge>
      </View>
      <Meter progress={progress} />
      <Animated.View style={[{ alignSelf: "center" }, impact.style]}>
        <Pressable
          testID="scene-tower"
          accessibilityLabel="Game arena"
          disabled={done || falling}
          onPress={place}
          style={{
            width: 300,
            height: 380,
            borderWidth: 2,
            borderColor: C.ink,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <Backdrop theme="city" height={380} />
          <Svg width="300" height="380" style={{ position: "absolute" }}>
            <Path
              d="M30 0 L30 48 L270 48 L270 0 M20 38 L280 38 M70 38 L95 48 L120 38 L145 48 L170 38 L195 48 L220 38"
              fill="none"
              stroke="#553B3A"
              strokeWidth="2.5"
            />
            <Path d="M20 36 L280 36" stroke="#F7D77D" strokeWidth="3" />
            <ALine
              animatedProps={rope}
              y1="48"
              y2="67"
              stroke="#553B3A"
              strokeWidth="2"
            />
            <Rect x="0" y="355" width="300" height="25" fill="#6D8074" />
            <Line
              x1="0"
              x2="300"
              y1="355"
              y2="355"
              stroke="#EBCE93"
              strokeWidth="4"
            />
          </Svg>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                inset: 0,
                transformOrigin: "bottom center",
              },
              stackStyle,
            ]}
          >
            {blocks.map((b, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: b.x,
                  top: 330 - i * 21,
                  width: b.w,
                  height: 23,
                }}
              >
                <BuildingBlock width={b.w} id={i} />
              </View>
            ))}
          </Animated.View>
          {!done && (
            <Animated.View
              pointerEvents="none"
              testID="falling-block"
              style={[
                {
                  position: "absolute",
                  left: 0,
                  top: 67,
                  width: blocks.at(-1)!.w,
                  height: 23,
                },
                movingStyle,
              ]}
            >
              <BuildingBlock width={blocks.at(-1)!.w} id={blocks.length} />
            </Animated.View>
          )}
          {debris && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  left: debris.x,
                  top: 330 - (blocks.length - 1) * 21,
                  width: debris.w,
                  height: 23,
                  backgroundColor: C.orange,
                  borderWidth: 1,
                  borderColor: C.ink,
                },
                offcutStyle,
              ]}
            />
          )}
          <Particles
            event={event}
            x={blocks.at(-1)!.x + blocks.at(-1)!.w / 2}
            y={330 - (blocks.length - 1) * 21}
            kind={perfect ? "spark" : "dust"}
            color={perfect ? C.yellow : "#EDD5AC"}
          />
          <Text
            style={[
              s.eyebrow,
              {
                position: "absolute",
                bottom: 6,
                alignSelf: "center",
                fontSize: 9,
                color: "#FFF8DE",
              },
            ]}
          >
            FUNSPLIT CONSTRUCTION CO.
          </Text>
        </Pressable>
      </Animated.View>
      {perfect && <Achievement event={event}>PERFECT DROP</Achievement>}
      <Text style={[s.body, { fontWeight: "800", textAlign: "center" }]}>
        {message}
      </Text>
      {done ? (
        <>
          {blocks.length >= 13 && <Reward />}
          <Button onPress={() => onDone(blocks.length - 1)}>
            Save score & pass it on →
          </Button>
        </>
      ) : (
        <Button disabled={falling} onPress={place}>
          {falling ? "Incoming…" : "Drop block ↓"}
        </Button>
      )}
    </StateCard>
  );
}
function BuildingBlock({ width, id }: any) {
  return (
    <Svg width={width} height="23" viewBox={`0 0 ${width} 23`}>
      <Defs>
        <LinearGradient id={`building-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop stopColor={id % 2 ? "#FF9B65" : "#FFF28B"} />
          <Stop offset="1" stopColor={id % 2 ? "#C34C35" : "#B6BD4F"} />
        </LinearGradient>
      </Defs>
      <Rect
        x=".7"
        y=".7"
        width={Math.max(0, width - 1.4)}
        height="21"
        rx="3"
        fill={`url(#building-${id})`}
        stroke="#553332"
        strokeWidth="1.4"
      />
      <Line x1="3" x2={width - 3} y1="3" y2="3" stroke="#FFF5CF" opacity=".7" />
      {Array.from({ length: Math.floor(width / 25) }, (_, j) => (
        <React.Fragment key={j}>
          <Rect
            x={7 + j * 25}
            y="7"
            width="9"
            height="10"
            fill="#534B46"
            opacity=".7"
          />
          <Rect x={8 + j * 25} y="8" width="3" height="8" fill="#F9EABD" />
          <Line
            x1={6 + j * 25}
            x2={17 + j * 25}
            y1="18"
            y2="18"
            stroke="#553332"
            strokeWidth="1"
          />
        </React.Fragment>
      ))}
    </Svg>
  );
}
