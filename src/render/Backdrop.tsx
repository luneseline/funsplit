import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Ellipse,
  G,
  Line,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";
export const Backdrop = memo(function Backdrop({
  theme = "sky",
  height = 370,
}: {
  theme?: "sky" | "city" | "range" | "stadium" | "studio";
  height?: number;
}) {
  const t = useSharedValue(0),
    reduced = useReducedMotion();
  useEffect(() => {
    if (!reduced)
      t.value = withRepeat(withTiming(1, { duration: 18000 }), -1, true);
    return () => cancelAnimation(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -t.value * 22 }],
  }));
  const warm = theme === "city",
    night = theme === "stadium";
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 300 ${height}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={`sky-${theme}`} x1="0" y1="0" x2=".6" y2="1">
            <Stop
              offset="0"
              stopColor={
                night
                  ? "#252C52"
                  : warm
                    ? "#F2B9A1"
                    : theme === "studio"
                      ? "#EEE7DF"
                      : "#95CAE6"
              }
            />
            <Stop
              offset="1"
              stopColor={night ? "#727B95" : warm ? "#FAE4AF" : "#EDF5EC"}
            />
          </LinearGradient>
          <RadialGradient id={`sun-${theme}`}>
            <Stop stopColor="#FFF9CF" stopOpacity=".85" />
            <Stop offset="1" stopColor="#FFF9CF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="300" height={height} fill={`url(#sky-${theme})`} />
        <Circle cx="245" cy="65" r="84" fill={`url(#sun-${theme})`} />
        <Circle cx="245" cy="65" r="25" fill={night ? "#FCF1D6" : "#FFF3BB"} />
        {theme === "city" ? (
          <>
            {Array.from({ length: 12 }, (_, i) => (
              <G key={i}>
                <Rect
                  x={i * 29 - 10}
                  y={height - 75 - (i % 4) * 18}
                  width="24"
                  height="100"
                  fill={i % 2 ? "#A9B0B5" : "#8BA1AE"}
                  opacity=".55"
                />
                {[0, 1, 2].map((j) => (
                  <Rect
                    key={j}
                    x={i * 29 - 6}
                    y={height - 65 - (i % 4) * 18 + j * 12}
                    width="4"
                    height="5"
                    fill="#F9E5AB"
                  />
                ))}
              </G>
            ))}
            <Path
              d={`M0 ${height - 45} L25 ${height - 45} L25 ${height - 95} L70 ${height - 95} L70 ${height - 20} L115 ${height - 20} L115 ${height - 65} L145 ${height - 65} L145 ${height} L0 ${height}Z`}
              fill="#6C8993"
              opacity=".6"
            />
          </>
        ) : theme === "stadium" ? (
          <>
            {[0, 1, 2].map((i) => (
              <Path
                key={i}
                d={`M-10 ${60 + i * 18} Q150 ${100 + i * 18} 310 ${60 + i * 18}`}
                stroke={["#E9F056", "#D7EFFF", "#FF5C34"][i]}
                strokeWidth="12"
                fill="none"
                opacity=".6"
              />
            ))}
            {Array.from({ length: 36 }, (_, i) => (
              <Circle
                key={i}
                cx={i * 9}
                cy={80 + Math.sin(i) * 8}
                r="2"
                fill={i % 2 ? "#F9F8F2" : "#E9F056"}
              />
            ))}
          </>
        ) : theme === "studio" ? (
          <>
            <Ellipse
              cx="150"
              cy={height - 30}
              rx="135"
              ry="30"
              fill="#B4A496"
              opacity=".2"
            />
            <Path
              d={`M0 ${height - 45} Q150 ${height - 75} 300 ${height - 45}`}
              fill="none"
              stroke="#FFF"
              strokeWidth="2"
            />
          </>
        ) : (
          <>
            <Path
              d={`M0 ${height * 0.7} Q70 ${height * 0.35} 140 ${height * 0.65} T300 ${height * 0.55} L300 ${height} L0 ${height}Z`}
              fill="#AAC1BA"
            />
            <Path
              d={`M0 ${height * 0.78} Q90 ${height * 0.5} 190 ${height * 0.78} T300 ${height * 0.75} L300 ${height} L0 ${height}Z`}
              fill="#718F83"
            />
            <Path
              d={`M0 ${height * 0.9} Q120 ${height * 0.64} 300 ${height * 0.94} L300 ${height} L0 ${height}Z`}
              fill="#405E55"
              opacity=".6"
            />
            {theme === "range" &&
              [8, 270, 285].map((x, i) => (
                <G key={x}>
                  <Path
                    d={`M${x} 110 L${x - 25} 240 L${x + 25} 240Z`}
                    fill="#315E56"
                    opacity=".65"
                  />
                  <Line
                    x1={x}
                    x2={x}
                    y1="150"
                    y2="280"
                    stroke="#315E56"
                    strokeWidth="4"
                  />
                </G>
              ))}
          </>
        )}
      </Svg>
      <Animated.View
        style={[
          { position: "absolute", top: 40, left: 0, width: 340, height: 65 },
          style,
        ]}
      >
        <Svg width="340" height="65">
          <Path
            d="M15 30 Q25 10 40 25 Q55 0 72 25 Q95 17 100 37 L15 37Z M185 48 Q200 22 215 39 Q235 14 252 39 Q275 26 285 50Z"
            fill="#FFF"
            opacity={night ? 0.1 : 0.5}
          />
        </Svg>
      </Animated.View>
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 300 ${height}`}
        preserveAspectRatio="none"
      >
        <Rect
          x="1"
          y="1"
          width="298"
          height={height - 2}
          rx="22"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          opacity=".35"
        />
      </Svg>
    </View>
  );
});
