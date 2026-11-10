import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { type GameId, type Player } from "./model";
import { Button, Character, C, s, buzz } from "./ui";
import Archery from "./games/Archery";
import Tower from "./games/Tower";
import Price from "./games/Price";
import { Badge, Burst, Ready } from "./games/shared";
type Props = {
  id: GameId;
  player: Player;
  onDone: (n: number) => void;
  round: number;
};
export default function Game(props: Props) {
  if (props.id === "archery") return <Archery {...props} />;
  if (props.id === "tower") return <Tower {...props} />;
  if (props.id === "price") return <Price {...props} />;
  return <Arcade {...props} />;
}
function Arcade({ id, player, onDone }: Props) {
  const [started, setStarted] = useState(false),
    [done, setDone] = useState(false),
    [score, setScore] = useState(0),
    [frame, setFrame] = useState(0),
    [angle, setAngle] = useState(-42),
    [power, setPower] = useState(50),
    [message, setMessage] = useState(""),
    [shooting, setShooting] = useState(false);
  const bird = useRef({ y: 140, v: 0, x: 310, gap: 150, points: 0 }),
    cue = useRef({ x: 55, y: 240, vx: 0, vy: 0 }),
    ball = useRef({ x: 220, y: 90, vx: 0, vy: 0, hit: false, pocketed: false }),
    active = useRef(false),
    ended = useRef(false),
    rotation = useRef(new Animated.Value(0)).current;
  function finish(n: number, note = "") {
    if (ended.current) return;
    ended.current = true;
    active.current = false;
    setScore(n);
    setMessage(note);
    setDone(true);
    buzz(true);
  }
  useEffect(() => {
    if (!started || done || id === "wheel") return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now(),
        dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      setFrame((n) => n + 1);
      if (id === "flappy") {
        const b = bird.current;
        b.v += 660 * dt;
        b.y += b.v * dt;
        b.x -= 100 * dt;
        if (b.x < -45) {
          b.x = 315;
          b.gap = 100 + Math.random() * 125;
          b.points++;
          setScore(b.points);
          buzz();
        }
        if (
          b.y < 0 ||
          b.y > 302 ||
          (b.x < 90 &&
            b.x + 42 > 60 &&
            (b.y < b.gap - 68 || b.y + 28 > b.gap + 68))
        )
          finish(
            b.points,
            "Snack attack. Your flight has been deliciously cancelled.",
          );
      }
      if (id === "pool" && active.current) {
        const c = cue.current,
          o = ball.current;
        for (const b of [c, o]) {
          if (b === o && o.pocketed) continue;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vx *= Math.pow(0.35, dt);
          b.vy *= Math.pow(0.35, dt);
          if (
            [
              [20, 20],
              [280, 20],
              [20, 310],
              [280, 310],
            ].some(([x, y]) => Math.hypot(b.x - x, b.y - y) < 17)
          ) {
            if (b === o) {
              o.pocketed = true;
              finish(100, "Pocketed! A very expensive little victory.");
            } else
              finish(0, "Scratch. The white ball was feeling adventurous.");
            break;
          }
          if (b.x < 22 || b.x > 278) {
            b.vx *= -0.85;
            b.x = Math.max(22, Math.min(278, b.x));
          }
          if (b.y < 22 || b.y > 308) {
            b.vy *= -0.85;
            b.y = Math.max(22, Math.min(308, b.y));
          }
        }
        const dx = o.x - c.x,
          dy = o.y - c.y,
          d = Math.hypot(dx, dy);
        if (d > 0 && d < 23 && !o.hit) {
          const nx = dx / d,
            ny = dy / d,
            impact = c.vx * nx + c.vy * ny;
          if (impact > 0) {
            o.vx = nx * impact;
            o.vy = ny * impact;
            c.vx -= o.vx;
            c.vy -= o.vy;
            o.hit = true;
            buzz();
          }
        }
        if (
          Math.hypot(c.vx, c.vy) + Math.hypot(o.vx, o.vy) < 12 &&
          !ended.current
        ) {
          const distance = Math.min(
            ...[
              [20, 20],
              [280, 20],
              [20, 310],
              [280, 310],
            ].map(([x, y]) => Math.hypot(o.x - x, o.y - y)),
          );
          finish(
            o.hit ? Math.max(1, Math.round(70 - distance / 3)) : 0,
            o.hit
              ? "Nearly. Closer to a pocket earns more points."
              : "Missed. At least the table looks nice.",
          );
        }
      }
    }, 25);
    return () => clearInterval(timer);
  }, [started, done, id]);
  useEffect(() => () => rotation.stopAnimation(), []);
  function spin() {
    setStarted(true);
    const sector = Math.floor(Math.random() * 10);
    Animated.timing(rotation, {
      toValue: 2160 - (sector * 36 + 18),
      duration: 3400,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished)
        finish(
          (sector + 1) * 10,
          "The wheel has spoken. Please direct complaints to the universe.",
        );
    });
  }
  if (!started)
    return (
      <Ready
        player={player}
        description={
          id === "flappy"
            ? "Tap to flap through a ridiculous food court. Dodge the snacks and count every gate."
            : id === "pool"
              ? "One shot. Aim the cue ball, set your power, and pocket orange for 100 points. Near misses score by distance; scratches score zero."
              : "One spin. Ten luck sectors. A bigger number gives your wallet a better chance."
        }
        onReady={
          <Button onPress={id === "wheel" ? spin : () => setStarted(true)}>
            {id === "wheel" ? "Spin my fate ↻" : "I’m ready. Let’s play →"}
          </Button>
        }
      />
    );
  return (
    <View style={{ gap: 16, alignItems: "center" }}>
      <View style={[s.row, { width: "100%", justifyContent: "space-between" }]}>
        <Badge>
          {id === "pool"
            ? "THE ONE-SHOT CLUB"
            : id === "wheel"
              ? "THE WHEEL OF FINANCIAL FATE"
              : "SNACK AIRLINES · FLIGHT 404"}
        </Badge>
        <Text style={{ fontSize: 25, fontWeight: "900", color: C.ink }}>
          {score} {id === "flappy" ? "GATES" : "PTS"}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Game arena"
        onPress={() => {
          if (id === "flappy") {
            bird.current.v = -250;
            buzz();
          }
        }}
        disabled={id !== "flappy" || done}
        style={{
          width: 300,
          height: 330,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 24,
          backgroundColor: id === "pool" ? "#799B83" : C.blue,
          overflow: "hidden",
        }}
      >
        {id === "flappy" && (
          <>
            <Svg width="300" height="330" style={{ position: "absolute" }}>
              <Path
                d="M0 270 Q75 200 150 270 T300 270 L300 330 L0 330Z"
                fill={C.sage}
                opacity=".6"
              />
              <Path
                d={`M${(frame * -0.5) % 360} 50 Q30 20 60 50 Q90 20 110 50 M150 80 Q180 50 210 80`}
                stroke={C.paper}
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
            <View
              style={{
                position: "absolute",
                left: 57,
                top: bird.current.y,
                transform: [
                  {
                    rotate: `${Math.max(-25, Math.min(35, bird.current.v / 12))}deg`,
                  },
                ],
              }}
            >
              <Character {...player} size={32} mood="determined" />
            </View>
            <View
              style={{
                position: "absolute",
                left: bird.current.x,
                top: 0,
                width: 42,
                height: bird.current.gap - 68,
                backgroundColor: C.orange,
                borderWidth: 2,
                borderColor: C.ink,
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 18,
                justifyContent: "flex-end",
              }}
            >
              <Text style={{ fontSize: 30 }}>🍕</Text>
            </View>
            <View
              style={{
                position: "absolute",
                left: bird.current.x,
                top: bird.current.gap + 68,
                bottom: 0,
                width: 42,
                backgroundColor: C.yellow,
                borderWidth: 2,
                borderColor: C.ink,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
              }}
            >
              <Text style={{ fontSize: 30 }}>🍔</Text>
            </View>
            <Text
              style={[
                s.eyebrow,
                { position: "absolute", left: 14, bottom: 13 },
              ]}
            >
              TAP TO FLAP · AVOID THE MENU
            </Text>
          </>
        )}
        {id === "pool" && (
          <Svg width="300" height="330">
            <Path
              d="M18 18 L282 18 L282 312 L18 312Z"
              fill="none"
              stroke={C.ink}
              strokeWidth="14"
              strokeLinejoin="round"
            />
            {[
              [20, 20],
              [280, 20],
              [20, 310],
              [280, 310],
            ].map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r="13" fill={C.ink} />
            ))}
            {[65, 110, 155, 200, 245].map((y) => (
              <Circle key={y} cx="18" cy={y} r="2" fill={C.paper} />
            ))}
            {!shooting && !done && (
              <>
                <Line
                  x1="55"
                  y1="240"
                  x2={55 + 210 * Math.cos((angle * Math.PI) / 180)}
                  y2={240 + 210 * Math.sin((angle * Math.PI) / 180)}
                  stroke={C.paper}
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                />
                <Line
                  x1={55 - 15 * Math.cos((angle * Math.PI) / 180)}
                  y1={240 - 15 * Math.sin((angle * Math.PI) / 180)}
                  x2={55 - 75 * Math.cos((angle * Math.PI) / 180)}
                  y2={240 - 75 * Math.sin((angle * Math.PI) / 180)}
                  stroke={C.yellow}
                  strokeWidth="5"
                />
              </>
            )}
            {!ball.current.pocketed && (
              <>
                <Circle
                  cx={ball.current.x}
                  cy={ball.current.y}
                  r="12"
                  fill={C.orange}
                  stroke={C.ink}
                  strokeWidth="2"
                />
                <Circle
                  cx={ball.current.x - 3}
                  cy={ball.current.y - 4}
                  r="3"
                  fill={C.paper}
                  opacity=".65"
                />
              </>
            )}
            <Circle
              cx={cue.current.x}
              cy={cue.current.y}
              r="10"
              fill={C.paper}
              stroke={C.ink}
            />
            <SvgText
              x="150"
              y="163"
              textAnchor="middle"
              fill={C.paper}
              opacity=".2"
              fontSize="17"
              fontWeight="900"
            >
              POCKET MONEY
            </SvgText>
          </Svg>
        )}
        {id === "wheel" && (
          <View
            style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
          >
            <Text
              style={{
                fontSize: 30,
                color: C.ink,
                zIndex: 2,
                marginBottom: -10,
              }}
            >
              ▼
            </Text>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [0, 2160],
                      outputRange: ["0deg", "2160deg"],
                    }),
                  },
                ],
              }}
            >
              <Svg width="260" height="260" viewBox="-130 -130 260 260">
                {Array.from({ length: 10 }, (_, i) => {
                  const a = ((i * 36 - 90) * Math.PI) / 180,
                    b = (((i + 1) * 36 - 90) * Math.PI) / 180,
                    m = (a + b) / 2;
                  return (
                    <React.Fragment key={i}>
                      <Path
                        d={`M0 0 L${120 * Math.cos(a)} ${120 * Math.sin(a)} A120 120 0 0 1 ${120 * Math.cos(b)} ${120 * Math.sin(b)} Z`}
                        fill={
                          [C.yellow, C.orange, C.blue, C.sage, C.paper][i % 5]
                        }
                        stroke={C.ink}
                        strokeWidth="2"
                      />
                      <SvgText
                        x={92 * Math.cos(m)}
                        y={92 * Math.sin(m) + 5}
                        textAnchor="middle"
                        fill={C.ink}
                        fontWeight="900"
                        fontSize="16"
                      >
                        {(i + 1) * 10}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
                <Circle r="26" fill={C.ink} />
                <SvgText y="9" textAnchor="middle" fill={C.paper} fontSize="27">
                  $
                </SvgText>
              </Svg>
            </Animated.View>
          </View>
        )}
        {done && score >= 60 && <Burst />}
      </Pressable>
      {id === "pool" && !done && (
        <View style={[s.card, { padding: 15, width: "100%", gap: 12 }]}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={s.eyebrow}>AIM {angle}°</Text>
            <Text style={s.eyebrow}>POWER {power}%</Text>
          </View>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Button
              disabled={shooting}
              secondary
              onPress={() => setAngle((n) => Math.max(-90, n - 3))}
            >
              ← Aim
            </Button>
            <Button
              disabled={shooting}
              secondary
              onPress={() => setAngle((n) => Math.min(45, n + 3))}
            >
              Aim →
            </Button>
          </View>
          <View style={s.row}>
            <Button
              disabled={shooting}
              secondary
              onPress={() => setPower((n) => Math.max(10, n - 10))}
            >
              −
            </Button>
            <View
              style={{
                flex: 1,
                height: 10,
                backgroundColor: C.sage,
                borderRadius: 5,
              }}
            >
              <View
                style={{
                  width: `${power}%`,
                  height: 10,
                  backgroundColor: C.orange,
                  borderRadius: 5,
                }}
              />
            </View>
            <Button
              disabled={shooting}
              secondary
              onPress={() => setPower((n) => Math.min(100, n + 10))}
            >
              +
            </Button>
          </View>
          <Button
            disabled={shooting}
            onPress={() => {
              const a = (angle * Math.PI) / 180;
              cue.current.vx = Math.cos(a) * power * 6;
              cue.current.vy = Math.sin(a) * power * 6;
              active.current = true;
              setShooting(true);
              buzz();
            }}
          >
            Shoot →
          </Button>
        </View>
      )}
      {done ? (
        <View style={{ gap: 14, width: "100%" }}>
          <Text style={[s.title, { fontSize: 28, textAlign: "center" }]}>
            {score} {id === "flappy" ? "gates" : "points"}. The damage is done.
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>{message}</Text>
          <Button onPress={() => onDone(score)}>
            Save score & pass it on →
          </Button>
        </View>
      ) : id === "flappy" ? (
        <Text style={s.muted}>
          Tap anywhere in the arena. The snacks are not your friends.
        </Text>
      ) : id === "wheel" ? (
        <Text style={s.muted}>Shuffling your financial future…</Text>
      ) : null}
    </View>
  );
}
