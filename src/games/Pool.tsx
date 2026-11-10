import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  runOnJS,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Line,
  G,
  Ellipse,
  Text as ST,
} from "react-native-svg";
import { Button, C, s, buzz } from "../ui";
import { type Player } from "../model";
import { Ready, Badge } from "./shared";
import { Counter, Particles, StateCard, useImpact } from "../render/fx";
import { initialPool, stepPool } from "../render/physics";
import { useSfx } from "../render/sound";
import Reward from "../render/Reward";
const AG = Animated.createAnimatedComponent(G),
  ACircle = Animated.createAnimatedComponent(Circle);
export default function PoolGame({
  player,
  onDone,
}: {
  player: Player;
  onDone: (n: number) => void;
}) {
  const [started, setStarted] = useState(false),
    [done, setDone] = useState(false),
    [score, setScore] = useState(0),
    [angle, setAngle] = useState(-42),
    [power, setPower] = useState(50),
    [shooting, setShooting] = useState(false),
    [message, setMessage] = useState(""),
    [event, setEvent] = useState(0),
    [contact, setContact] = useState({ x: 220, y: 90 });
  const world = useSharedValue(initialPool()),
    active = useSharedValue(false),
    acc = useSharedValue(0),
    recoil = useSharedValue(0);
  const sound = useSfx(),
    shake = useImpact();
  function collision(x: number, y: number) {
    setContact({ x, y });
    setEvent((n) => n + 1);
    sound("impact");
    shake.hit(2);
    buzz();
  }
  function finish(value: number, scratch: boolean) {
    setDone(true);
    setScore(value);
    setEvent((n) => n + 1);
    setMessage(
      value === 100
        ? "Pocketed! A very expensive little victory."
        : scratch
          ? "Scratch. The white ball was feeling adventurous."
          : world.value.ball.hit
            ? "Nearly. Closer to a pocket earns more points."
            : "Missed. At least the table looks nice.",
    );
    sound(value === 100 ? "reward" : "fail");
    buzz(true);
  }
  const frame = useFrameCallback((info) => {
    if (!active.value) return;
    acc.value += Math.min(info.timeSincePreviousFrame ?? 16.67, 40);
    while (acc.value >= 25 && active.value) {
      acc.value -= 25;
      const r = stepPool(world.value, 0.025);
      world.value = r.state;
      if (r.impact || r.wall)
        runOnJS(collision)(r.state.ball.x, r.state.ball.y);
      if (r.score !== null) {
        active.value = false;
        runOnJS(finish)(r.score, r.scratch);
      }
    }
  }, false);
  useEffect(() => {
    frame.setActive(shooting && !done);
    return () => frame.setActive(false);
  }, [shooting, done]);
  const cueStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -recoil.value * Math.cos((angle * Math.PI) / 180) },
      { translateY: -recoil.value * Math.sin((angle * Math.PI) / 180) },
    ],
  }));
  if (!started)
    return (
      <Ready
        player={player}
        description="One shot. Aim the cue ball, set your power, and pocket orange for 100 points. Near misses score by distance; scratches score zero."
        onReady={
          <Button onPress={() => setStarted(true)}>
            I’m ready. Let’s play →
          </Button>
        }
      />
    );
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>THE ONE-SHOT CLUB</Badge>
        <Counter value={score} label=" PTS" />
      </View>
      <Animated.View style={[{ alignSelf: "center" }, shake.style]}>
        <Pressable
          accessibilityLabel="Game arena"
          testID="scene-pool"
          style={{
            width: 300,
            height: 330,
            borderRadius: 25,
            borderWidth: 2,
            borderColor: C.ink,
            overflow: "hidden",
            backgroundColor: "#254E48",
          }}
        >
          <Svg width="300" height="330">
            <Defs>
              <LinearGradient id="wood">
                <Stop stopColor="#9A6548" />
                <Stop offset=".45" stopColor="#4D2E2B" />
                <Stop offset="1" stopColor="#AF7C51" />
              </LinearGradient>
              <RadialGradient id="felt">
                <Stop stopColor="#599C85" />
                <Stop offset="1" stopColor="#204D45" />
              </RadialGradient>
              <RadialGradient id="white-ball" cx=".3" cy=".22">
                <Stop stopColor="#FFF" />
                <Stop offset=".65" stopColor="#ECE8DC" />
                <Stop offset="1" stopColor="#B1AA9B" />
              </RadialGradient>
              <RadialGradient id="orange-ball" cx=".28" cy=".2">
                <Stop stopColor="#FFCB8A" />
                <Stop offset=".35" stopColor="#FF783F" />
                <Stop offset="1" stopColor="#A63320" />
              </RadialGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="300"
              height="330"
              rx="24"
              fill="url(#wood)"
            />
            {[5, 10, 15].map((n) => (
              <Rect
                key={n}
                x={n}
                y={n}
                width={300 - n * 2}
                height={330 - n * 2}
                rx="15"
                fill="none"
                stroke="#DDB27C"
                opacity=".2"
              />
            ))}
            <Rect
              x="25"
              y="25"
              width="250"
              height="280"
              rx="8"
              fill="url(#felt)"
            />
            {Array.from({ length: 35 }, (_, i) => (
              <Line
                key={i}
                x1="28"
                x2="272"
                y1={29 + i * 8}
                y2={29 + i * 8}
                stroke="#BCE1BC"
                strokeWidth=".5"
                opacity=".08"
              />
            ))}
            <Path
              d="M28 302 L28 28 L272 28"
              stroke="#9BC9A4"
              strokeWidth="2"
              fill="none"
              opacity=".3"
            />
            {[
              [20, 20],
              [280, 20],
              [20, 310],
              [280, 310],
            ].map(([x, y], i) => (
              <G key={i}>
                <Circle
                  cx={x}
                  cy={y}
                  r="16"
                  fill="#2A2227"
                  stroke="#B88D62"
                  strokeWidth="3"
                />
                <Circle cx={x + 1} cy={y + 2} r="10" fill="#141D20" />
              </G>
            ))}
            {[65, 110, 155, 200, 245].map((y) => (
              <G key={y}>
                <Path
                  d={`M17 ${y - 3} l3 3 l-3 3 l-3 -3Z M283 ${y - 3} l3 3 l-3 3 l-3 -3Z`}
                  fill="#F3D9A7"
                />
              </G>
            ))}
            {!shooting && (
              <Line
                x1="55"
                y1="240"
                x2={55 + 210 * Math.cos((angle * Math.PI) / 180)}
                y2={240 + 210 * Math.sin((angle * Math.PI) / 180)}
                stroke="#E8F4CB"
                strokeWidth="1.5"
                strokeDasharray="3 6"
              />
            )}
            <ST
              x="150"
              y="170"
              fill="#D7EAD5"
              opacity=".18"
              fontSize="13"
              textAnchor="middle"
              letterSpacing="3"
            >
              FUNSPLIT
            </ST>
            <BallSprite world={world} acc={acc} kind="ball" />
            <BallSprite world={world} acc={acc} kind="cue" />
          </Svg>
          {!done && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  inset: 0,
                  opacity: shooting ? 0.35 : 1,
                },
                cueStyle,
              ]}
            >
              <Svg width="300" height="330">
                <Line
                  x1={55 - 15 * Math.cos((angle * Math.PI) / 180)}
                  y1={240 - 15 * Math.sin((angle * Math.PI) / 180)}
                  x2={55 - 90 * Math.cos((angle * Math.PI) / 180)}
                  y2={240 - 90 * Math.sin((angle * Math.PI) / 180)}
                  stroke="#261D26"
                  strokeWidth="7"
                />
                <Line
                  x1={55 - 15 * Math.cos((angle * Math.PI) / 180)}
                  y1={240 - 15 * Math.sin((angle * Math.PI) / 180)}
                  x2={55 - 90 * Math.cos((angle * Math.PI) / 180)}
                  y2={240 - 90 * Math.sin((angle * Math.PI) / 180)}
                  stroke="#DEBC84"
                  strokeWidth="4"
                />
              </Svg>
            </Animated.View>
          )}
          <Particles
            event={event}
            x={contact.x}
            y={contact.y}
            kind={score === 100 ? "bubble" : "spark"}
          />
        </Pressable>
      </Animated.View>
      {!done && (
        <View style={[s.card, { padding: 14, gap: 12 }]}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={s.eyebrow}>AIM {angle}°</Text>
            <Text style={s.eyebrow}>POWER {power}%</Text>
          </View>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Button
              disabled={shooting}
              secondary
              onPress={() => {
                setAngle((n) => Math.max(-90, n - 3));
                sound("tick");
              }}
            >
              ← Aim
            </Button>
            <Button
              disabled={shooting}
              secondary
              onPress={() => {
                setAngle((n) => Math.min(45, n + 3));
                sound("tick");
              }}
            >
              Aim →
            </Button>
          </View>
          <View style={s.row}>
            <Button
              disabled={shooting}
              secondary
              onPress={() => setPower((n) => Math.max(10, n - 10))}
            >
              −
            </Button>
            <View
              style={{
                flex: 1,
                height: 8,
                backgroundColor: "#351E2820",
                borderRadius: 6,
              }}
            >
              <View
                style={{
                  width: `${power}%`,
                  height: 8,
                  backgroundColor: C.orange,
                  borderRadius: 6,
                }}
              />
            </View>
            <Button
              disabled={shooting}
              secondary
              onPress={() => setPower((n) => Math.min(100, n + 10))}
            >
              +
            </Button>
          </View>
          <Button
            disabled={shooting}
            onPress={() => {
              const a = (angle * Math.PI) / 180;
              world.value = {
                ...world.value,
                cue: {
                  ...world.value.cue,
                  vx: Math.cos(a) * power * 6,
                  vy: Math.sin(a) * power * 6,
                },
              };
              active.value = true;
              recoil.value = withSequence(
                withTiming(14, { duration: 50 }),
                withTiming(0, { duration: 90 }),
              );
              setShooting(true);
              sound("whoosh");
              buzz();
            }}
          >
            Shoot →
          </Button>
        </View>
      )}
      {done && (
        <>
          {score === 100 && <Reward />}
          <Text style={[s.title, { fontSize: 26, textAlign: "center" }]}>
            {score} points. The damage is done.
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>{message}</Text>
          <Button onPress={() => onDone(score)}>
            Save score & pass it on →
          </Button>
        </>
      )}
    </StateCard>
  );
}
function BallSprite({ world, acc, kind }: any) {
  const props = useAnimatedProps(() => {
    const b = world.value[kind],
      dt = acc.value / 1000;
    return {
      transform: `translate(${b.x + b.vx * dt} ${b.y + b.vy * dt})`,
      opacity: kind === "ball" && world.value.ball.pocketed ? 0 : 1,
    };
  });
  const r = kind === "cue" ? 10 : 12;
  return (
    <>
      <BallTrail world={world} kind={kind} i={1} />
      <BallTrail world={world} kind={kind} i={2} />
      <BallTrail world={world} kind={kind} i={3} />
      <AG testID={`pool-${kind}`} animatedProps={props}>
        <Ellipse
          cx="2"
          cy="4"
          rx={r + 1}
          ry={r * 0.8}
          fill="#0C302D"
          opacity=".5"
        />
        <Circle
          r={r}
          fill={`url(#${kind === "cue" ? "white" : "orange"}-ball)`}
          stroke="#351E28"
          strokeWidth=".7"
        />
        <Circle cx="-3" cy="-4" r="3" fill="#FFF" opacity=".7" />
        {kind === "ball" && (
          <>
            <Circle r="5" fill="#FFF0DA" />
            <ST
              y="3"
              fontSize="8"
              fontWeight="900"
              textAnchor="middle"
              fill="#8D362B"
            >
              1
            </ST>
          </>
        )}
      </AG>
    </>
  );
}
function BallTrail({ world, kind, i }: any) {
  const props = useAnimatedProps(() => {
    const b = world.value[kind],
      speed = Math.hypot(b.vx, b.vy);
    return {
      cx: b.x - b.vx * 0.018 * i,
      cy: b.y - b.vy * 0.018 * i,
      opacity: Math.min(0.22, speed / 1600) * (1 - i * 0.2),
    };
  });
  return (
    <ACircle
      animatedProps={props}
      r={kind === "cue" ? 8 : 10}
      fill={kind === "cue" ? "#F9F8F2" : "#FF8D5D"}
    />
  );
}
