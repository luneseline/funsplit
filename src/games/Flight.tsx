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
  G,
  Text as ST,
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
                left: -15,
                top: 0,
                width: 72,
              },
              top,
            ]}
          >
            <SnackTower side="top" />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: -15,
                bottom: 0,
                width: 72,
              },
              bottom,
            ]}
          >
            <SnackTower side="bottom" />
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
function SnackTower({ side }: { side: "top" | "bottom" }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withTiming(1, { duration: 900 });
  }, []);
  const sway = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${side === "top" ? -2 : 2}deg` },
      { translateX: bob.value * (side === "top" ? 1 : -1) },
    ],
  }));
  return (
    <Animated.View
      style={[{ width: "100%", height: "100%", overflow: "hidden" }, sway]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 72 240"
        preserveAspectRatio="xMidYMax slice"
      >
        {Array.from({ length: 7 }, (_, i) => {
          const y = side === "top" ? i * 36 - 3 : 240 - i * 36 - 30;
          const kind = (i + (side === "top" ? 0 : 2)) % 4;
          if (kind === 0)
            return (
              <G
                key={i}
                transform={`translate(${i % 2 ? 8 : 18} ${y}) rotate(${i % 2 ? 7 : -6})`}
              >
                <Path
                  d="M2 2 L47 16 L11 34 Z"
                  fill="#FFD568"
                  stroke={C.ink}
                  strokeWidth="2"
                />
                <Path
                  d="M2 2 Q24 -4 47 16"
                  stroke="#B96A31"
                  strokeWidth="6"
                  fill="none"
                />
                <Circle cx="20" cy="15" r="4" fill={C.orange} />
                <Circle cx="32" cy="21" r="4" fill={C.orange} />
              </G>
            );
          if (kind === 1)
            return (
              <G
                key={i}
                transform={`translate(${i % 2 ? 18 : 7} ${y}) rotate(${i % 2 ? -8 : 5})`}
              >
                <Circle
                  cx="24"
                  cy="18"
                  r="17"
                  fill="#ECA75A"
                  stroke={C.ink}
                  strokeWidth="2"
                />
                <Circle
                  cx="24"
                  cy="18"
                  r="7"
                  fill="#D7EFFF"
                  stroke={C.ink}
                  strokeWidth="2"
                />
                <Path
                  d="M10 11 Q24 1 39 12"
                  stroke="#F58AB0"
                  strokeWidth="6"
                  fill="none"
                />
              </G>
            );
          if (kind === 2)
            return (
              <G
                key={i}
                transform={`translate(${i % 2 ? 8 : 20} ${y}) rotate(${i % 2 ? 5 : -7})`}
              >
                <Path
                  d="M4 12 Q25 -3 46 12 L42 21 L8 21Z"
                  fill="#E2A245"
                  stroke={C.ink}
                  strokeWidth="2"
                />
                <Path
                  d="M7 22 L44 22 L39 29 L11 29Z"
                  fill="#684336"
                  stroke={C.ink}
                  strokeWidth="2"
                />
                <Path d="M9 19 L43 19" stroke="#8BAB50" strokeWidth="5" />
              </G>
            );
          return (
            <G
              key={i}
              transform={`translate(${i % 2 ? 19 : 9} ${y}) rotate(${i % 2 ? -5 : 8})`}
            >
              <Path
                d="M5 7 L42 7 L38 34 L9 34Z"
                fill={i % 2 ? C.orange : "#D92F45"}
                stroke={C.ink}
                strokeWidth="2"
              />
              <Path
                d="M13 5 L15 -8 M21 6 L23 -10 M29 6 L33 -7 M36 7 L41 -5"
                stroke="#FFD857"
                strokeWidth="4"
              />
              <ST
                x="24"
                y="26"
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fill={C.paper}
              >
                FRIES
              </ST>
            </G>
          );
        })}
      </Svg>
    </Animated.View>
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
