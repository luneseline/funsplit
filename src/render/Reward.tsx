import React from "react";
import { View, Text } from "react-native";
import { Particles } from "./fx";
export default function Reward() {
  return (
    <View
      pointerEvents="none"
      style={{
        width: 160,
        height: 110,
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 60 }}>🏆</Text>
      <Particles event={1} x={80} y={50} kind="confetti" />
    </View>
  );
}
