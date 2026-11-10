import { svgMatrixProps } from "./render/svgTransform";
import { rotateAbout } from "./render/svgTransformMath";
import React, { useEffect, useId } from "react";
import Svg, {
  Path,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";
const AG = Animated.createAnimatedComponent(G),
  AEllipse = Animated.createAnimatedComponent(Ellipse),
  ink = "#351E28";
const shapes: Record<string, string> = {
  bean: "M29 76 C12 62 16 35 32 23 C44 12 64 20 72 33 C90 44 86 68 73 80 C59 89 42 88 29 76Z",
  ghost: "M22 78 L23 43 C22 11 76 10 78 43 L82 80 L69 72 L59 83 L47 74 L35 82Z",
  star: "M50 14 L61 33 L83 32 L73 52 L86 72 L64 73 L51 88 L39 74 L17 76 L27 55 L17 36 L40 34Z",
  blob: "M22 71 C8 57 25 46 21 32 C19 17 42 14 50 25 C59 6 83 21 76 37 C95 42 90 63 76 66 C81 89 52 94 43 79 C32 88 20 86 22 71Z",
};
export default function Character({
  face = "bean",
  color = "#E9F056",
  size = 70,
  mood = "happy",
  animated = false,
  animationState = "idle",
  animateCharacter = false,
}: any) {
  const cycle = useSharedValue(0),
    blink = useSharedValue(5),
    reduced = useReducedMotion(),
    uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  useEffect(() => {
    cycle.value = 0;
    if (!reduced && (animated || animateCharacter)) {
      cycle.value = withRepeat(
        withTiming(Math.PI * 2, {
          duration:
            animationState === "moving"
              ? 360
              : animationState === "winning"
                ? 700
                : 2200,
        }),
        -1,
        false,
      );
      blink.value = withRepeat(
        withSequence(
          withDelay(2500, withTiming(0.4, { duration: 75 })),
          withTiming(5, { duration: 100 }),
        ),
        -1,
        false,
      );
    }
    return () => {
      cancelAnimation(cycle);
      cancelAnimation(blink);
    };
  }, [animationState, reduced, animated, animateCharacter]);
  const leftArm = useAnimatedProps(() =>
      svgMatrixProps(
        rotateAbout(
          animationState === "winning"
            ? 45 + Math.sin(cycle.value) * 10
            : animationState === "interacting"
              ? 30 + Math.sin(cycle.value) * 28
              : Math.sin(cycle.value) * (animationState === "moving" ? 32 : 5),
          32,
          66,
        ),
      ),
    ),
    rightArm = useAnimatedProps(() =>
      svgMatrixProps(
        rotateAbout(
          animationState === "winning"
            ? -45 - Math.sin(cycle.value) * 10
            : -Math.sin(cycle.value) * (animationState === "moving" ? 32 : 7),
          70,
          66,
        ),
      ),
    ),
    leftLeg = useAnimatedProps(() =>
      svgMatrixProps(
        rotateAbout(
          Math.sin(cycle.value) * (animationState === "moving" ? 28 : 2),
          38,
          80,
        ),
      ),
    ),
    rightLeg = useAnimatedProps(() =>
      svgMatrixProps(
        rotateAbout(
          -Math.sin(cycle.value) * (animationState === "moving" ? 28 : 2),
          65,
          80,
        ),
      ),
    ),
    eyes = useAnimatedProps(() => ({ ry: blink.value })),
    idle = useAnimatedStyle(() => ({
      transform: [
        { translateY: animated ? Math.sin(cycle.value) * -size * 0.025 : 0 },
        { rotate: animated ? `${Math.sin(cycle.value) * 3}deg` : "0deg" },
      ],
    }));
  return (
    <Animated.View
      accessibilityLabel={`${face} doodle character`}
      style={[{ width: size, height: size }, idle]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`toon-${uid}`} x1=".2" y1="0" x2=".7" y2="1">
            <Stop stopColor="#FFF5CE" />
            <Stop offset=".25" stopColor={color} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Ellipse cx="51" cy="95" rx="26" ry="3" fill={ink} opacity=".16" />
        <G
          fill="none"
          stroke={ink}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <AG animatedProps={leftArm}>
            <Path d="M32 66 Q20 74 12 59 M11 60 L9 56 M12 59 L14 54" />
          </AG>
          <AG animatedProps={rightArm}>
            <Path d="M70 66 Q84 73 91 60 M90 60 L95 57 M91 60 L90 55" />
          </AG>
          <AG animatedProps={leftLeg}>
            <Path d="M38 79 L34 91 L24 92" strokeWidth="4" />
          </AG>
          <AG animatedProps={rightLeg}>
            <Path d="M65 79 L68 91 L78 92" strokeWidth="4" />
          </AG>
          <Path d={shapes[face] || shapes.bean} fill={`url(#toon-${uid})`} />
          <Path
            d={shapes[face] || shapes.bean}
            transform="translate(1.2 -.5)"
            strokeWidth=".7"
            opacity=".45"
          />
          <Path
            d="M31 32 Q35 27 40 29"
            stroke="#FFF9DF"
            strokeWidth="4"
            opacity=".7"
          />
          {face === "bean" && (
            <Path d="M35 21 Q38 8 45 15 M40 21 Q50 9 52 17" />
          )}
          {face === "ghost" && <Path d="M27 37 Q48 25 74 37" opacity=".4" />}
          {face === "star" && <Path d="M33 31 L40 22 M70 31 L77 23" />}
          {face === "blob" && <Path d="M30 29 L40 37 L53 23" strokeWidth="4" />}
          <Path
            d={
              mood === "sad"
                ? "M33 42 L44 38 M57 38 L68 42"
                : mood === "determined"
                  ? "M34 40 L43 44 M57 44 L67 40"
                  : "M34 39 Q39 35 44 39 M56 39 Q61 35 66 39"
            }
          />
          <AEllipse animatedProps={eyes} cx="40" cy="48" rx="3" fill={ink} />
          <AEllipse animatedProps={eyes} cx="61" cy="48" rx="3" fill={ink} />
          {mood === "sad" ? (
            <Path d="M42 66 Q51 56 61 66" />
          ) : face === "ghost" ? (
            <Ellipse cx="51" cy="63" rx="5" ry="7" fill={ink} />
          ) : mood === "determined" ? (
            <Path d="M43 63 L59 63" />
          ) : (
            <>
              <Path d="M40 59 Q50 76 62 59Z" fill={ink} />
              <Path d="M44 61 L58 61" stroke="#FFF9E7" strokeWidth="2" />
            </>
          )}
          <Path
            d="M27 56 L32 57 M69 56 L74 54"
            stroke="#FF5C34"
            strokeWidth="3"
          />
          {face === "star" && <Path d="M67 49 L71 53 L75 48" />}
        </G>
      </Svg>
    </Animated.View>
  );
}
