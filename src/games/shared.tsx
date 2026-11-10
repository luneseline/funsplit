import Sprite from "../render/Sprite";
import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { C, s, Character } from "../ui";
export function Badge({ children, color = C.yellow }: any) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: color,
        borderWidth: 1.5,
        borderColor: C.ink,
        borderRadius: 12,
      }}
    >
      <Text style={[s.eyebrow, { letterSpacing: 1, fontSize: 10 }]}>
        {children}
      </Text>
    </View>
  );
}
export function Burst({ active = true }: any) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }).start();
    }
    return () => progress.stopAnimation();
  }, [active]);
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {Array.from({ length: 24 }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 37) % 100}%`,
            top: "28%",
            width: i % 2 ? 7 : 12,
            height: i % 2 ? 16 : 7,
            backgroundColor: [C.orange, C.yellow, C.blue, C.ink][i % 4],
            opacity: progress.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0, -55 - (i % 5) * 12, 280],
                }),
              },
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (i % 2 ? 1 : -1) * (30 + i * 3)],
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${i * 70}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
export function Ready({ player, title, description, onReady }: any) {
  return (
    <View style={{ gap: 20, alignItems: "center", paddingVertical: 20 }}>
      <Badge>YOUR MOMENT OF QUESTIONABLE GLORY</Badge>
      <Sprite {...player} state="idle" size={115} />
      <Text style={[s.title, { fontSize: 30, textAlign: "center" }]}>
        {title || `${player.name}, you’re up.`}
      </Text>
      <Text style={[s.body, { textAlign: "center", maxWidth: 350 }]}>
        {description}
      </Text>
      {onReady}
    </View>
  );
}
