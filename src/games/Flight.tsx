import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Path,
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Ready, Badge } from "./shared";
import { Backdrop } from "../render/Backdrop";
import {
  Counter,
  Particles,
  StateCard,
  Achievement,
  useImpact,
} from "../render/fx";
import Sprite from "../render/Sprite";
import { stepFlight } from "../render/physics";
import { useSfx } from "../render/sound";
export default function Flight({
  player,
  onDone,
}: {
  player: Player;
  onDone: (n: number) => void;
}) {
  const [started, setStarted] = useState(false),
    [done, setDone] = useState(false),
    [score, setScore] = useState(0),
    [event, setEvent] = useState(0),
    [impactY, setImpactY] = useState(150);
  const world = useSharedValue({ y: 140, v: 0, x: 310, gap: 150, points: 0 }),
    active = useSharedValue(false),
    acc = useSharedValue(0),
    flash = useSharedValue(0);
  const impact = useImpact(),
    sound = useSfx();
  function gate(points: number) {
    setScore(points);
    setEvent((n) => n + 1);
    sound("reward");
    buzz();
  }
  function crash(points: number, y: number) {
    setImpactY(y);
    setScore(points);
    setDone(true);
    setEvent((n) => n + 1);
    impact.hit(6);
    sound("fail");
    buzz(true);
  }
  const frame = useFrameCallback((info) => {
    if (!active.value) return;
    acc.value += Math.min(info.timeSincePreviousFrame ?? 16.67, 40);
    while (acc.value >= 25 && active.value) {
      acc.value -= 25;
      const r = stepFlight(world.value, 0.025, 100 + Math.random() * 125);
      world.value = r.state;
      if (r.gate) runOnJS(gate)(r.state.points);
      if (r.dead) {
        active.value = false;
        runOnJS(crash)(r.state.points, r.state.y);
      }
    }
  }, false);
  useEffect(() => {
    frame.setActive(started && !done);
    return () => frame.setActive(false);
  }, [started, done]);
  const birdStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: world.value.y + (world.value.v * acc.value) / 1000 },
      { rotate: `${Math.max(-25, Math.min(35, world.value.v / 12))}deg` },
      { scaleX: 1 + flash.value * 0.14 },
      { scaleY: 1 - flash.value * 0.13 },
    ],
  }));
  const top = useAnimatedStyle(() => ({
      height: world.value.gap - 68,
      transform: [{ translateX: world.value.x - (100 * acc.value) / 1000 }],
    })),
    bottom = useAnimatedStyle(() => ({
      top: world.value.gap + 68,
      transform: [{ translateX: world.value.x - (100 * acc.value) / 1000 }],
    }));
  function flap() {
    if (!active.value) return;
    world.value = { ...world.value, v: -250 };
    flash.value = 1;
    flash.value = withTiming(0, { duration: 180 });
    sound("whoosh");
    buzz();
  }
  if (!started)
    return (
      <Ready
        player={player}
        description="Tap to flap through a ridiculous food court. Dodge the snacks and count every gate."
        onReady={
          <Button
            onPress={() => {
              active.value = true;
              setStarted(true);
            }}
          >
            I’m ready. Let’s play →
          </Button>
        }
      />
    );
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>SNACK AIRLINES · FLIGHT 404</Badge>
        <Counter value={score} label=" GATES" />
      </View>
      <Animated.View style={[{ alignSelf: "center" }, impact.style]}>
        <Pressable
          testID="scene-flight"
          accessibilityLabel="Game arena"
          onPress={flap}
          disabled={done}
          style={{
            width: 300,
            height: 330,
            borderWidth: 2,
            borderColor: C.ink,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <Backdrop height={330} />
          <Svg width="300" height="330" style={{ position: "absolute" }}>
            <Path
              d="M0 310 Q60 290 120 310 T300 310 L300 330 L0 330Z"
              fill="#294D45"
            />
            {[8, 45, 95, 170, 235, 280].map((x) => (
              <Path
                key={x}
                d={`M${x} 319 l3 -12 l4 12 l4 -8`}
                stroke="#9CC289"
                strokeWidth="2"
                fill="none"
              />
            ))}
          </Svg>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                width: 42,
                borderBottomLeftRadius: 17,
                borderBottomRightRadius: 17,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: C.ink,
                backgroundColor: "#F5AB58",
              },
              top,
            ]}
          >
            <Food type="pizza" />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                bottom: 0,
                width: 42,
                borderTopLeftRadius: 17,
                borderTopRightRadius: 17,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: C.ink,
                backgroundColor: C.yellow,
              },
              bottom,
            ]}
          >
            <Food type="burger" />
          </Animated.View>
          {[0, 1, 2, 3].map((i) => (
            <AirTrail key={i} world={world} i={i} />
          ))}
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", left: 57, top: 0 }, birdStyle]}
          >
            <Sprite {...player} state={done ? "losing" : "jumping"} size={32} />
          </Animated.View>
          <Particles
            event={event}
            x={72}
            y={done ? impactY : 150}
            kind={done ? "dust" : "spark"}
            color={done ? C.orange : C.yellow}
          />
          <Text
            style={[
              s.eyebrow,
              {
                position: "absolute",
                bottom: 12,
                left: 14,
                color: C.paper,
                fontSize: 9,
              },
            ]}
          >
            TAP TO FLAP · AVOID THE MENU
          </Text>
        </Pressable>
      </Animated.View>
      {score > 0 && !done && (
        <Achievement event={score}>
          {score % 5 === 0 ? "FREQUENT FLYER" : "GATE CLEARED"}
        </Achievement>
      )}
      {done ? (
        <>
          <Text style={[s.title, { fontSize: 26, textAlign: "center" }]}>
            {score} gates. Grounded by lunch.
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>
            Snack attack. Your flight has been deliciously cancelled.
          </Text>
          <Button onPress={() => onDone(score)}>
            Save score & pass it on →
          </Button>
        </>
      ) : (
        <Text style={[s.muted, { textAlign: "center" }]}>
          Tap anywhere in the arena. The snacks are not your friends.
        </Text>
      )}
    </StateCard>
  );
}
function Food({ type }: any) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 42 180"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id={`food-${type}`}>
          <Stop stopColor={type === "pizza" ? "#FFE391" : "#E6BC46"} />
          <Stop
            offset="1"
            stopColor={type === "pizza" ? "#D25C36" : "#A15A27"}
          />
        </LinearGradient>
      </Defs>
      <Rect width="42" height="180" fill={`url(#food-${type})`} />
      {Array.from({ length: 6 }, (_, i) =>
        type === "pizza" ? (
          <React.Fragment key={i}>
            <Circle
              cx={i % 2 ? 28 : 12}
              cy={18 + i * 28}
              r="6"
              fill="#C54B35"
              stroke="#8F3A2E"
              strokeWidth="1"
            />
            <Path
              d={`M${i % 2 ? 10 : 28} ${20 + i * 28} l4 -4`}
              stroke="#6C823C"
              strokeWidth="2"
            />
          </React.Fragment>
        ) : (
          <React.Fragment key={i}>
            <Rect
              x="0"
              y={10 + i * 29}
              width="42"
              height="10"
              rx="3"
              fill="#684336"
            />
            <Path
              d={`M0 ${24 + i * 29} l8 -3 l8 5 l8 -5 l8 5 l10 -3`}
              stroke="#8BAB50"
              strokeWidth="5"
            />
            <Line
              x1="0"
              x2="42"
              y1={18 + i * 29}
              y2={18 + i * 29}
              stroke="#FFDA60"
              strokeWidth="3"
            />
          </React.Fragment>
        ),
      )}
    </Svg>
  );
}
function AirTrail({ world, i }: any) {
  const style = useAnimatedStyle(() => ({
    opacity: 0.4 - i * 0.08,
    transform: [
      { translateY: world.value.y + 15 + world.value.v * i * 0.018 },
      { scaleX: 1 + Math.abs(world.value.v) / 600 },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 49 - i * 8,
          width: 9 - i,
          height: 2,
          borderRadius: 3,
          backgroundColor: C.paper,
        },
        style,
      ]}
    />
  );
}
