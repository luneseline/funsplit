import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Character from "./Character";
import { useSfx } from "./render/sound";
import { C, s } from "./ui";

const DECISIONS = ["WHO PAYS?", "WHERE TO EAT?", "WHAT TO WATCH?"];
const PARTY_BITS = [
  "✦",
  "🍕",
  "⚡",
  "🍩",
  "✳",
  "🍟",
  "◆",
  "🥤",
  "🎯",
  "☠",
  "💬",
  "🏆",
];

export default function LaunchIntro({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0),
    reveal = useSharedValue(0),
    burst = useSharedValue(0),
    orbit = useSharedValue(0);
  const sound = useSfx();

  useEffect(() => {
    float.value = reduced
      ? 0
      : withRepeat(
          withSequence(
            withTiming(-9, { duration: 460 }),
            withTiming(7, { duration: 460 }),
          ),
          -1,
          true,
        );
    burst.value = withDelay(
      reduced ? 0 : 220,
      withSpring(1, { damping: 8, stiffness: 125 }),
    );
    orbit.value = reduced
      ? 0
      : withRepeat(withTiming(1, { duration: 1700 }), -1, false);
    reveal.value = withDelay(
      reduced ? 30 : 760,
      withTiming(1, { duration: reduced ? 120 : 430 }),
    );
    const cue = setTimeout(() => sound("reward"), reduced ? 60 : 520);
    const timer = setTimeout(onFinish, reduced ? 450 : 2400);
    return () => {
      clearTimeout(timer);
      clearTimeout(cue);
      cancelAnimation(float);
      cancelAnimation(reveal);
      cancelAnimation(burst);
      cancelAnimation(orbit);
    };
  }, []);

  const mascot = useAnimatedStyle(() => ({
      transform: [
        { translateY: float.value },
        { rotate: `${float.value * -0.8}deg` },
        { scale: 0.55 + burst.value * 0.45 },
      ],
    })),
    logo = useAnimatedStyle(() => ({
      opacity: Math.max(0, Math.min(1, reveal.value)),
      transform: [
        { scale: 0.65 + reveal.value * 0.35 },
        { translateY: (1 - reveal.value) * 24 },
      ],
    })),
    ring = useAnimatedStyle(() => ({
      opacity: Math.max(0, Math.min(0.28, burst.value * 0.28)),
      transform: [
        { rotate: `${orbit.value * 360}deg` },
        { scale: 0.75 + burst.value * 0.25 },
      ],
    })),
    progress = useAnimatedStyle(() => ({
      transform: [{ scaleX: Math.max(0, Math.min(1, reveal.value)) }],
    }));

  return (
    <Animated.View
      exiting={FadeOut.duration(220)}
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
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: 260,
          backgroundColor: C.blue,
          opacity: 0.42,
          transform: [{ translateX: -230 }, { translateY: -330 }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 430,
          height: 430,
          borderRadius: 215,
          backgroundColor: C.orange,
          opacity: 0.18,
          transform: [{ translateX: 250 }, { translateY: 340 }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: 285,
            height: 285,
            borderRadius: 145,
            borderWidth: 3,
            borderStyle: "dashed",
            borderColor: C.ink,
          },
          ring,
        ]}
      />
      {PARTY_BITS.map((bit, i) => (
        <Animated.View
          key={`${bit}-${i}`}
          entering={FadeIn.delay(reduced ? 0 : 70 + i * 40).springify()}
          style={{
            position: "absolute",
            left: `${5 + ((i * 29) % 88)}%`,
            top: `${5 + ((i * 23) % 82)}%`,
          }}
        >
          <Text
            style={{
              fontSize: 20 + (i % 3) * 6,
              transform: [{ rotate: `${i * 29 - 70}deg` }],
            }}
          >
            {bit}
          </Text>
        </Animated.View>
      ))}

      <Animated.View
        entering={ZoomIn.delay(reduced ? 0 : 100)
          .springify()
          .damping(8)}
        style={{ flexDirection: "row", alignItems: "flex-end" }}
      >
        <View
          style={{
            transform: [{ rotate: "-18deg" }, { translateX: 18 }],
          }}
        >
          <Character face="bean" color={C.blue} size={82} mood="determined" />
        </View>
        <Animated.View style={[{ zIndex: 2 }, mascot]}>
          <Character
            animated={!reduced}
            face="star"
            color={C.orange}
            size={140}
          />
        </Animated.View>
        <View style={{ transform: [{ rotate: "16deg" }, { translateX: -18 }] }}>
          <Character face="ghost" color={C.sage} size={82} />
        </View>
      </Animated.View>

      <Animated.View style={[{ alignItems: "center", marginTop: 10 }, logo]}>
        <Text style={[s.title, { fontSize: 58, letterSpacing: -4 }]}>
          funsplit<Text style={{ color: C.orange }}>*</Text>
        </Text>
        <Text style={[s.eyebrow, { marginTop: 6 }]}>PASS · PLAY · PAY UP</Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 6,
            marginTop: 15,
            maxWidth: 340,
          }}
        >
          {DECISIONS.map((label, i) => (
            <Animated.View
              key={label}
              entering={FadeInDown.delay(reduced ? 0 : 960 + i * 100)}
            >
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: C.ink,
                  backgroundColor:
                    i === 1 ? C.blue : i === 2 ? C.orange : C.paper,
                  transform: [
                    { rotate: `${i === 0 ? -3 : i === 2 ? 3 : 0}deg` },
                  ],
                }}
              >
                <Text style={[s.eyebrow, { fontSize: 8 }]}>{label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <View
        style={{
          position: "absolute",
          bottom: 43,
          width: 150,
          height: 5,
          borderRadius: 5,
          overflow: "hidden",
          backgroundColor: "#351E2822",
        }}
      >
        <Animated.View
          style={[
            {
              width: "100%",
              height: 5,
              borderRadius: 5,
              backgroundColor: C.ink,
              transformOrigin: "left center",
            },
            progress,
          ]}
        />
      </View>
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
