import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Path, Ellipse, Circle, G } from "react-native-svg";
const ink = "#351E28";
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
}: any) {
  const wobble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);
  return (
    <Animated.View
      accessibilityLabel={`${face} doodle character`}
      style={{
        width: size,
        height: size,
        transform: [
          {
            translateY: wobble.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -size * 0.055],
            }),
          },
          {
            rotate: wobble.interpolate({
              inputRange: [0, 1],
              outputRange: ["-3deg", "3deg"],
            }),
          },
        ],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Ellipse cx="51" cy="94" rx="27" ry="3" fill={ink} opacity=".12" />
        <G
          fill="none"
          stroke={ink}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M32 70 Q22 70 13 59 M70 68 Q84 73 91 60 M37 80 L34 91 L25 92 M65 80 L68 91 L77 92" />
          <Path d={shapes[face] || shapes.bean} fill={color} />
          <Path
            d={shapes[face] || shapes.bean}
            transform="translate(1.2 -.5)"
            strokeWidth=".7"
            opacity=".5"
          />
          {face === "bean" && (
            <Path d="M35 21 Q38 8 45 15 M40 21 Q50 9 52 17" />
          )}
          {face === "ghost" && <Path d="M27 37 Q48 25 74 37" opacity=".4" />}
          {face === "star" && <Path d="M33 31 L40 22 M70 31 L77 23" />}
          {face === "blob" && <Path d="M30 29 L40 37 L53 23" strokeWidth="4" />}
          <Path
            d={
              mood === "determined"
                ? "M34 40 L43 44 M57 44 L67 40"
                : "M34 39 Q39 35 44 39 M56 39 Q61 35 66 39"
            }
          />
          <Ellipse cx="40" cy="48" rx="3" ry="5" fill={ink} />
          <Ellipse cx="61" cy="48" rx="3" ry="5" fill={ink} />
          {face === "ghost" ? (
            <Ellipse cx="51" cy="63" rx="5" ry="7" fill={ink} />
          ) : (
            <Path
              d={
                mood === "determined" ? "M43 63 L59 63" : "M40 59 Q50 76 62 59Z"
              }
              fill={ink}
            />
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
