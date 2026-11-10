import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";
import Character from "../Character";
export type SpriteState =
  "idle" | "moving" | "jumping" | "interacting" | "winning" | "losing";
export default function Sprite({
  state = "idle",
  ...props
}: {
  state?: SpriteState;
  [key: string]: any;
}) {
  const p = useSharedValue(0),
    reduced = useReducedMotion();
  useEffect(() => {
    cancelAnimation(p);
    p.value = 0;
    if (!reduced)
      p.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration:
              state === "moving" ? 130 : state === "winning" ? 250 : 550,
          }),
          withTiming(0, { duration: state === "moving" ? 130 : 550 }),
        ),
        -1,
        false,
      );
    return () => cancelAnimation(p);
  }, [state, reduced]);
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          state === "moving"
            ? -p.value * 5
            : state === "jumping"
              ? -p.value * 10
              : state === "winning"
                ? -p.value * 12
                : 0,
      },
      {
        rotate: `${state === "losing" ? 12 + p.value * 5 : (p.value - 0.5) * (state === "moving" ? 12 : 4)}deg`,
      },
      {
        scaleX:
          state === "jumping"
            ? 1.08 - p.value * 0.16
            : state === "interacting"
              ? 1 + p.value * 0.05
              : 1,
      },
      {
        scaleY:
          state === "losing"
            ? 0.92
            : state === "jumping"
              ? 0.92 + p.value * 0.2
              : 1,
      },
    ],
  }));
  return (
    <Animated.View testID={`sprite-${state}`} style={style}>
      <Character
        {...props}
        animationState={state}
        animateCharacter
        mood={
          state === "losing"
            ? "sad"
            : state === "winning"
              ? "happy"
              : "determined"
        }
      />
    </Animated.View>
  );
}
