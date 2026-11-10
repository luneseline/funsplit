import React from "react";
import { View } from "react-native";
import LottieView from "lottie-react-native";
import { useReducedMotion } from "react-native-reanimated";
export default function Reward() {
  const reduced = useReducedMotion();
  return (
    <View pointerEvents="none">
      <LottieView
        source={require("../../assets/animations/reward.json")}
        autoPlay={!reduced}
        loop={false}
        progress={reduced ? 0.6 : undefined}
        style={{ width: 160, height: 160, alignSelf: "center" }}
      />
    </View>
  );
}
