import Character from "./Character";
import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
export const C = {
  ink: "#351E28",
  yellow: "#E9F056",
  orange: "#FF5C34",
  blue: "#D7EFFF",
  sage: "#AEBBAD",
  paper: "#F9F8F2",
};
export function buzz(success = false) {
  if (Platform.OS !== "web")
    (success
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ).catch(() => {});
  else if (typeof navigator !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(success ? [30, 40, 60] : 12);
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  testID,
}: any) {
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => {
        buzz();
        onPress?.();
      }}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ translateY: 3 }], shadowOpacity: 0 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: C.ink }]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function Chip({ children, active, onPress }: any) {
  return (
    <Pressable
      onPress={() => {
        buzz();
        onPress();
      }}
      style={[s.chip, active && { backgroundColor: C.ink }]}
    >
      <Text
        style={{
          color: active ? C.paper : C.ink,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export { default as Character } from "./Character";
export const s = StyleSheet.create({
  button: {
    backgroundColor: C.ink,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  secondary: { backgroundColor: C.paper, borderWidth: 1.5, borderColor: C.ink },
  buttonText: { color: C.paper, fontSize: 16, fontWeight: "800" },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderColor: C.ink,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  title: { fontSize: 38, fontWeight: "900", letterSpacing: -1.5, color: C.ink },
  body: { fontSize: 15, lineHeight: 23, color: C.ink },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 2, color: C.ink },
  input: {
    borderWidth: 1.5,
    borderColor: C.ink,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    color: C.ink,
    backgroundColor: C.paper,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  card: {
    borderWidth: 1.5,
    borderColor: C.ink,
    borderRadius: 24,
    padding: 22,
    gap: 14,
    backgroundColor: C.paper,
  },
  muted: { color: "#75686D", fontSize: 13, lineHeight: 20 },
});
export function GameArt({ id }: { id: string }) {
  if (id === "tower")
    return (
      <View
        style={{
          width: 160,
          height: 115,
          justifyContent: "flex-end",
          alignItems: "center",
          transform: [{ rotate: "-8deg" }],
        }}
      >
        {[80, 100, 120, 140].map((w, i) => (
          <View
            key={w}
            style={{
              width: w,
              height: 24,
              backgroundColor: i % 2 ? C.orange : C.yellow,
              borderColor: C.ink,
              borderWidth: 2,
              borderRadius: 5,
              marginTop: -1,
              transform: [{ translateX: i === 0 ? 22 : i === 1 ? -8 : 0 }],
            }}
          />
        ))}
      </View>
    );
  if (id === "race")
    return (
      <View style={s.row}>
        <View style={{ gap: 10 }}>
          {[40, 60, 30].map((w, i) => (
            <View
              key={i}
              style={{
                width: w,
                height: 4,
                borderRadius: 3,
                backgroundColor: C.ink,
                alignSelf: "flex-end",
              }}
            />
          ))}
        </View>
        <View style={{ transform: [{ rotate: "16deg" }] }}>
          <Character color={C.orange} size={95} />
        </View>
      </View>
    );
  if (id === "pool")
    return (
      <View
        style={{
          width: 106,
          height: 106,
          borderRadius: 53,
          backgroundColor: C.ink,
          borderWidth: 3,
          borderColor: C.ink,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: "14deg" }],
        }}
      >
        <View
          style={{
            width: 57,
            height: 57,
            borderRadius: 29,
            backgroundColor: C.paper,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 44, fontWeight: "900", color: C.ink }}>
            8
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            left: 20,
            top: 17,
            width: 15,
            height: 7,
            borderRadius: 5,
            backgroundColor: C.blue,
            transform: [{ rotate: "-35deg" }],
          }}
        />
      </View>
    );
  if (id === "archery")
    return (
      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 56,
          backgroundColor: C.ink,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: "-12deg" }],
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: C.paper,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              backgroundColor: C.orange,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: C.ink,
              }}
            />
          </View>
        </View>
        <View
          style={{
            position: "absolute",
            width: 92,
            height: 4,
            backgroundColor: C.ink,
            left: 52,
            top: 24,
            transform: [{ rotate: "-40deg" }],
          }}
        />
      </View>
    );
  if (id === "wheel")
    return (
      <View
        style={{
          width: 114,
          height: 114,
          borderRadius: 57,
          borderWidth: 3,
          borderColor: C.ink,
          backgroundColor: C.orange,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: "18deg" }],
        }}
      >
        {[0, 45, 90, 135].map((d) => (
          <View
            key={d}
            style={{
              position: "absolute",
              width: 108,
              height: 3,
              backgroundColor: C.ink,
              transform: [{ rotate: `${d}deg` }],
            }}
          />
        ))}
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 3,
            borderColor: C.ink,
            backgroundColor: C.blue,
          }}
        />
      </View>
    );
  return (
    <Text
      style={{
        fontSize: 88,
        color: C.ink,
        transform: [{ rotate: id === "flappy" ? "10deg" : "-12deg" }],
      }}
    >
      {id === "flappy" ? "🍔" : "◆"}
    </Text>
  );
}
