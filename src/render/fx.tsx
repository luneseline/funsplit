import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  cancelAnimation,
  FadeIn,
  FadeOut,
  useReducedMotion,
  type SharedValue,
} from "react-native-reanimated";
import { C } from "../ui";
export function useImpact() {
  const kick = useSharedValue(0),
    reduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: kick.value },
      { translateY: Math.abs(kick.value) * 0.25 },
    ],
  }));
  return {
    style,
    hit: (strength = 4) => {
      if (!reduced)
        kick.value = withSequence(
          withTiming(-strength, { duration: 35 }),
          withTiming(strength, { duration: 45 }),
          withTiming(-strength / 2, { duration: 45 }),
          withSpring(0, { damping: 15 }),
        );
    },
  };
}
export const Counter = memo(function Counter({
  value,
  label = "",
  size = 26,
  color = C.ink,
}: {
  value: number;
  label?: string;
  size?: number;
  color?: string;
}) {
  const pop = useSharedValue(1),
    reduced = useReducedMotion();
  useEffect(() => {
    pop.value = reduced
      ? 1
      : withSequence(
          withTiming(1.18, { duration: 80 }),
          withSpring(1, { damping: 11 }),
        );
    return () => cancelAnimation(pop);
  }, [value]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View style={style}>
      <Text
        style={{
          fontSize: size,
          fontWeight: "900",
          color,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
        {label}
      </Text>
    </Animated.View>
  );
});
export function Meter({
  progress,
  color = C.orange,
}: {
  progress: SharedValue<number>;
  color?: string;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0, Math.min(1, progress.value)) }],
  }));
  return (
    <View
      style={{
        height: 7,
        width: "100%",
        overflow: "hidden",
        borderRadius: 5,
        backgroundColor: "#351E281F",
      }}
    >
      <Animated.View
        style={[
          {
            height: 7,
            width: "100%",
            backgroundColor: color,
            transformOrigin: "left center",
            borderRadius: 5,
          },
          style,
        ]}
      />
    </View>
  );
}
export function StateCard({ children }: any) {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(100)}
      style={{ width: "100%", gap: 14 }}
    >
      {children}
    </Animated.View>
  );
}
export function Particles({
  event,
  x = 150,
  y = 150,
  kind = "spark",
  color = C.yellow,
}: {
  event: number;
  x?: number;
  y?: number;
  kind?: "spark" | "dust" | "bubble" | "confetti";
  color?: string;
}) {
  if (!event) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 16 }, (_, i) => (
        <Particle
          key={`${event}-${i}`}
          i={i}
          x={x}
          y={y}
          kind={kind}
          color={color}
        />
      ))}
    </View>
  );
}
function Particle({ i, x, y, kind, color }: any) {
  const p = useSharedValue(0),
    reduced = useReducedMotion();
  useEffect(() => {
    p.value = withDelay(
      (i % 4) * 12,
      withTiming(1, { duration: kind === "confetti" ? 1300 : 650 }),
    );
    return () => cancelAnimation(p);
  }, []);
  const angle = i * 2.399,
    speed = 25 + (i % 5) * 12;
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: reduced ? 0 : Math.cos(angle) * speed * p.value },
      {
        translateY: reduced
          ? 0
          : Math.sin(angle) * speed * p.value +
            (kind === "bubble" ? -70 : 90) * p.value * p.value,
      },
      { rotate: `${p.value * (i % 2 ? 220 : -220)}deg` },
      { scale: kind === "dust" ? 1 + p.value * 2 : 1 - p.value * 0.5 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: kind === "dust" ? 9 : kind === "bubble" ? 8 : 5,
          height: kind === "confetti" ? 12 : kind === "dust" ? 9 : 5,
          borderRadius: kind === "confetti" ? 1 : 10,
          backgroundColor:
            kind === "bubble" ? "transparent" : i % 3 === 0 ? C.paper : color,
          borderWidth: kind === "bubble" ? 1 : 0,
          borderColor: C.paper,
        },
        style,
      ]}
    />
  );
}
export function Achievement({ children, event = 1 }: any) {
  return (
    <Animated.View
      key={event}
      entering={FadeIn.duration(160)}
      style={{
        alignSelf: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: C.ink,
        backgroundColor: C.yellow,
        shadowColor: C.orange,
        shadowOpacity: 0.25,
        shadowRadius: 12,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 1,
          fontWeight: "900",
          color: C.ink,
        }}
      >
        ✦ {children}
      </Text>
    </Animated.View>
  );
}
