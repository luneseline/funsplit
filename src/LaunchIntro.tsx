import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { C, s } from "./ui";
import Character from "./Character";
import { useSfx } from "./render/sound";

export default function LaunchIntro({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0),
    reveal = useSharedValue(0);
  const sound = useSfx();
  useEffect(() => {
    float.value = reduced
      ? 0
      : withRepeat(
          withSequence(
            withTiming(-10, { duration: 500 }),
            withTiming(8, { duration: 500 }),
          ),
          -1,
          true,
        );
    reveal.value = withDelay(
      reduced ? 50 : 700,
      withSpring(1, { damping: 11, stiffness: 120 }),
    );
    const cue = setTimeout(() => sound("reward"), reduced ? 70 : 650);
    const timer = setTimeout(onFinish, reduced ? 450 : 2450);
    return () => {
      clearTimeout(timer);
      clearTimeout(cue);
    };
  }, []);
  const mascot = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { rotate: `${float.value * -0.8}deg` },
    ],
  }));
  const logo = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { scale: 0.65 + reveal.value * 0.35 },
      { translateY: (1 - reveal.value) * 25 },
    ],
  }));
  return (
    <Animated.View
      exiting={FadeOut.duration(250)}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 999,
        backgroundColor: C.yellow,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {["✦", "🍕", "⚡", "🍩", "✳", "🍟", "◆", "🥤"].map((v, i) => (
        <Animated.Text
          key={i}
          entering={FadeIn.delay(reduced ? 0 : 120 + i * 55)}
          style={{
            position: "absolute",
            left: `${8 + ((i * 29) % 84)}%`,
            top: `${8 + ((i * 19) % 76)}%`,
            fontSize: 22 + (i % 3) * 7,
            transform: [{ rotate: `${i * 29 - 70}deg` }],
          }}
        >
          {v}
        </Animated.Text>
      ))}
      <Animated.View entering={ZoomIn.springify().damping(9)} style={mascot}>
        <Character
          animated={!reduced}
          face="star"
          color={C.orange}
          size={135}
        />
      </Animated.View>
      <Animated.View style={[{ alignItems: "center", marginTop: 18 }, logo]}>
        <Text style={[s.title, { fontSize: 58, letterSpacing: -4 }]}>
          funsplit<Text style={{ color: C.orange }}>*</Text>
        </Text>
        <Text style={[s.eyebrow, { marginTop: 8 }]}>
          BIG DECISIONS · TINY GAMES
        </Text>
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip opening animation"
        onPress={onFinish}
        style={{ position: "absolute", right: 20, top: 52, padding: 10 }}
      >
        <Text style={s.eyebrow}>SKIP →</Text>
      </Pressable>
    </Animated.View>
  );
}
