import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
  runOnJS,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  Text as ST,
  G,
} from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Ready, Badge } from "./shared";
import { Backdrop } from "../render/Backdrop";
import { Counter, Particles, StateCard, Achievement } from "../render/fx";
import { useSfx } from "../render/sound";
import Reward from "../render/Reward";
export default function Wheel({
  player,
  onDone,
}: {
  player: Player;
  onDone: (n: number) => void;
}) {
  const [started, setStarted] = useState(false),
    [done, setDone] = useState(false),
    [score, setScore] = useState(0);
  const rotation = useSharedValue(0),
    needle = useSharedValue(0),
    destination = useSharedValue(0),
    sound = useSfx(),
    reduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({
      transform: [
        {
          rotate: `${reduced && rotation.value < destination.value ? 0 : rotation.value}deg`,
        },
      ],
    })),
    pointer = useAnimatedStyle(() => ({
      transform: [{ rotate: `${needle.value}deg` }],
    }));
  useAnimatedReaction(
    () => Math.floor(rotation.value / 36),
    (n, old) => {
      if (n !== old && old !== null) {
        if (!reduced)
          needle.value = withSequence(
            withTiming(-10, { duration: 30 }),
            withSpring(0, { damping: 10 }),
          );
        runOnJS(sound)("tick");
      }
    },
  );
  useEffect(
    () => () => {
      cancelAnimation(rotation);
      cancelAnimation(needle);
    },
    [],
  );
  function finish(n: number) {
    setScore(n);
    setDone(true);
    sound(n >= 60 ? "reward" : "fail");
    buzz(true);
  }
  function spin() {
    setStarted(true);
    const sector = Math.floor(Math.random() * 10),
      target = 2160 - (sector * 36 + 18);
    destination.value = target;
    sound("whoosh");
    rotation.value = withTiming(
      target,
      {
        duration: 3400,
        easing: reduced ? Easing.linear : Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) runOnJS(finish)((sector + 1) * 10);
      },
    );
  }
  if (!started)
    return (
      <Ready
        player={player}
        description="One spin. Ten luck sectors. A bigger number gives your wallet a better chance."
        onReady={<Button onPress={spin}>Spin my fate ↻</Button>}
      />
    );
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>THE WHEEL OF FINANCIAL FATE</Badge>
        <Counter value={score} label=" PTS" />
      </View>
      <Pressable
        accessibilityLabel="Game arena"
        testID="scene-wheel"
        style={{
          width: 300,
          height: 330,
          alignSelf: "center",
          borderRadius: 24,
          borderWidth: 2,
          borderColor: C.ink,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Backdrop theme="stadium" height={330} />
        <View
          style={{
            position: "absolute",
            bottom: 9,
            width: 180,
            height: 19,
            borderRadius: 100,
            backgroundColor: "#1E2339",
            opacity: 0.4,
          }}
        />
        <Svg width="300" height="330" style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id="wheel-gold">
              <Stop stopColor="#FFF2AB" />
              <Stop offset=".35" stopColor="#DE9A52" />
              <Stop offset=".65" stopColor="#B55B39" />
              <Stop offset="1" stopColor="#F5D38C" />
            </LinearGradient>
          </Defs>
          <Circle
            cx="150"
            cy="166"
            r="139"
            fill="url(#wheel-gold)"
            stroke="#2C2435"
            strokeWidth="4"
          />
          <Circle cx="150" cy="166" r="128" fill="#351E28" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12;
            return (
              <Circle
                key={i}
                cx={150 + 133 * Math.cos(a)}
                cy={166 + 133 * Math.sin(a)}
                r="3.5"
                fill={i % 2 ? "#FFF6C9" : "#E9F056"}
              />
            );
          })}
        </Svg>
        <Animated.View testID="wheel-disc" style={style}>
          <Svg width="250" height="250" viewBox="-125 -125 250 250">
            <Defs>
              <RadialGradient id="wheel-shade">
                <Stop offset=".1" stopColor="#FFF" stopOpacity=".2" />
                <Stop offset=".65" stopColor="#FFF" stopOpacity="0" />
                <Stop offset="1" stopColor="#351E28" stopOpacity=".3" />
              </RadialGradient>
            </Defs>
            {Array.from({ length: 10 }, (_, i) => {
              const a = ((i * 36 - 90) * Math.PI) / 180,
                b = (((i + 1) * 36 - 90) * Math.PI) / 180,
                m = (a + b) / 2;
              return (
                <G key={i}>
                  <Path
                    d={`M0 0 L${120 * Math.cos(a)} ${120 * Math.sin(a)} A120 120 0 0 1 ${120 * Math.cos(b)} ${120 * Math.sin(b)}Z`}
                    fill={[C.yellow, C.orange, C.blue, C.sage, C.paper][i % 5]}
                    stroke="#633E38"
                    strokeWidth="1.2"
                  />
                  <ST
                    x={91 * Math.cos(m)}
                    y={91 * Math.sin(m) + 5}
                    fontWeight="900"
                    fontSize="17"
                    textAnchor="middle"
                    fill={C.ink}
                  >
                    {(i + 1) * 10}
                  </ST>
                  <Circle
                    cx={113 * Math.cos(m)}
                    cy={113 * Math.sin(m)}
                    r="2"
                    fill="#FFF"
                    opacity=".6"
                  />
                </G>
              );
            })}
            <Circle r="120" fill="url(#wheel-shade)" />
            <Circle r="32" fill="#351E28" stroke="#E1B56B" strokeWidth="5" />
            <Circle r="23" fill="#553843" />
            <ST
              y="10"
              textAnchor="middle"
              fill="#FFE2A0"
              fontWeight="900"
              fontSize="29"
            >
              $
            </ST>
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            { position: "absolute", top: 15, transformOrigin: "top center" },
            pointer,
          ]}
        >
          <Svg width="30" height="44">
            <Path
              d="M3 4 Q15 -2 27 4 L15 39Z"
              fill="#FF5C34"
              stroke="#351E28"
              strokeWidth="2"
            />
            <Circle cx="15" cy="8" r="4" fill="#FFE5B5" />
          </Svg>
        </Animated.View>
        <Particles event={done ? 1 : 0} x={150} y={165} kind="confetti" />
      </Pressable>
      {done ? (
        <>
          {score >= 60 && (
            <>
              <Achievement>LUCKY SPIN</Achievement>
              <Reward />
            </>
          )}
          <Text style={[s.title, { fontSize: 28, textAlign: "center" }]}>
            {score} points. Fate has spoken.
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>
            The wheel has spoken. Please direct complaints to the universe.
          </Text>
          <Button onPress={() => onDone(score)}>
            Save score & pass it on →
          </Button>
        </>
      ) : (
        <Text style={[s.muted, { textAlign: "center" }]}>
          Shuffling your financial future…
        </Text>
      )}
    </StateCard>
  );
}
