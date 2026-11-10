import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Animated } from "react-native";
import { type GameId, prices, type Player } from "./model";
import { Button, Character, C, s, buzz } from "./ui";
const W = 300,
  H = 330;
export default function Game({
  id,
  player,
  onDone,
  round,
}: {
  id: GameId;
  player: Player;
  onDone: (n: number) => void;
  round: number;
}) {
  const [started, start] = useState(false),
    [done, setDone] = useState(false),
    [score, setScore] = useState(0),
    [time, setTime] = useState(10),
    [tick, setTick] = useState(0),
    [guess, setGuess] = useState(""),
    [shots, setShots] = useState(0),
    [power, setPower] = useState(50),
    [aim, setAim] = useState(0),
    [message, setMessage] = useState("");
  const t = useRef(0),
    ended = useRef(false),
    taps = useRef(0),
    blocks = useRef([{ x: 70, w: 160 }]),
    bird = useRef({ y: 150, v: 0, x: 310, gap: 150, points: 0 }),
    shot = useRef({ x: 55, y: 240, vx: 0, vy: 0, active: false }),
    objectBall = useRef({
      x: 220,
      y: 90,
      vx: 0,
      vy: 0,
      hit: false,
      pocketed: false,
    }),
    arrow = useRef({ x: 150, y: 150 }),
    anim = useRef(new Animated.Value(0)).current;
  const price = prices[round % prices.length];
  function finish(n: number) {
    if (ended.current) return;
    ended.current = true;
    setScore(n);
    setDone(true);
    buzz(true);
  }
  useEffect(() => {
    if (!started || done) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now(),
        dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t.current += dt;
      setTick((v) => v + 1);
      if (id === "race") {
        setTime(Math.max(0, 10 - t.current));
        if (t.current >= 10) finish(taps.current);
      }
      if (id === "tower" && t.current > 20) finish(blocks.current.length - 1);
      if (id === "flappy") {
        const b = bird.current;
        b.v += 700 * dt;
        b.y += b.v * dt;
        b.x -= 105 * dt;
        if (b.x < -45) {
          b.x = 315;
          b.gap = 100 + Math.random() * 125;
          b.points++;
          setScore(b.points);
          buzz();
        }
        if (
          b.y < 0 ||
          b.y > H - 28 ||
          (b.x < 91 &&
            b.x + 42 > 65 &&
            (b.y < b.gap - 65 || b.y + 28 > b.gap + 65))
        )
          finish(b.points);
      }
      if (id === "pool" && shot.current.active) {
        const b = shot.current,
          o = objectBall.current;
        for (const ball of [b, o]) {
          if (ball === o && o.pocketed) continue;
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          ball.vx *= Math.pow(0.35, dt);
          ball.vy *= Math.pow(0.35, dt);
          const pocket = [
            [20, 20],
            [280, 20],
            [20, 310],
            [280, 310],
          ].some(([x, y]) => Math.hypot(ball.x - x, ball.y - y) < 17);
          if (pocket) {
            if (ball === o) {
              o.pocketed = true;
              finish(100);
            } else {
              finish(0);
              setMessage("Scratch! The cue ball found a pocket.");
            }
            b.active = false;
            break;
          }
          if (ball.x < 22 || ball.x > 278) {
            ball.vx *= -0.85;
            ball.x = Math.max(22, Math.min(278, ball.x));
          }
          if (ball.y < 22 || ball.y > 308) {
            ball.vy *= -0.85;
            ball.y = Math.max(22, Math.min(308, ball.y));
          }
        }
        const dx = o.x - b.x,
          dy = o.y - b.y,
          d = Math.hypot(dx, dy);
        if (d < 23 && !o.hit) {
          const nx = dx / d,
            ny = dy / d,
            impact = b.vx * nx + b.vy * ny;
          if (impact > 0) {
            o.vx = nx * impact;
            o.vy = ny * impact;
            b.vx -= o.vx;
            b.vy -= o.vy;
            o.hit = true;
            buzz();
          }
        }
        if (
          Math.hypot(b.vx, b.vy) + Math.hypot(o.vx, o.vy) < 12 &&
          !ended.current
        ) {
          b.active = false;
          const nearest = Math.min(
            ...[
              [20, 20],
              [280, 20],
              [20, 310],
              [280, 310],
            ].map(([x, y]) => Math.hypot(o.x - x, o.y - y)),
          );
          finish(o.hit ? Math.max(1, Math.round(70 - nearest / 3)) : 0);
          setMessage(
            o.hit
              ? "Closer to a pocket = more points."
              : "Missed the orange ball.",
          );
        }
      }
    }, 25);
    return () => clearInterval(timer);
  }, [started, done, id]);
  function action() {
    if (done) return;
    buzz();
    if (!started) {
      start(true);
      return;
    }
    if (id === "race") {
      taps.current++;
      setScore(taps.current);
    }
    if (id === "tower") {
      const prev = blocks.current.at(-1)!,
        x = ((Math.sin(t.current * 2.8) + 1) * (W - prev.w)) / 2,
        left = Math.max(prev.x, x),
        right = Math.min(prev.x + prev.w, x + prev.w);
      if (right - left < 8) {
        finish(blocks.current.length - 1);
        return;
      }
      blocks.current.push({ x: left, w: right - left });
      setScore(blocks.current.length - 1);
      if (blocks.current.length >= 13) finish(12);
    }
    if (id === "flappy") bird.current.v = -255;
    if (id === "archery") {
      const x = 150 + Math.sin(t.current * 2.9) * 110,
        y = 155 + Math.cos(t.current * 3.7) * 105;
      arrow.current = { x, y };
      const val = Math.max(0, Math.round(100 - Math.hypot(x - 150, y - 155)));
      setScore((v) => v + val);
      setShots((v) => v + 1);
      setMessage(`${val} points!`);
      if (shots === 2) finish(score + val);
    }
  }
  function spin() {
    if (started) return;
    start(true);
    const n = Math.floor(Math.random() * 100) + 1;
    Animated.timing(anim, {
      toValue: 1440 + n * 3.6,
      duration: 2800,
      useNativeDriver: true,
    }).start(() => finish(n));
  }
  const movingX =
    ((Math.sin(t.current * 2.8) + 1) * (W - blocks.current.at(-1)!.w)) / 2;
  if (!started)
    return (
      <View style={{ gap: 22, alignItems: "center", paddingVertical: 35 }}>
        <Character {...player} size={110} />
        <Text style={s.title}>{player.name}, you’re up.</Text>
        <Text style={[s.body, { textAlign: "center" }]}>
          {instructions[id]}
        </Text>
        <Button onPress={id === "wheel" ? spin : () => start(true)}>
          {id === "wheel" ? "Spin my fate ↻" : "I’m ready. Let’s play →"}
        </Button>
      </View>
    );
  return (
    <View style={{ gap: 18, alignItems: "center" }}>
      <View style={[s.row, { justifyContent: "space-between", width: "100%" }]}>
        <Text style={s.eyebrow}>
          {player.name.toUpperCase()} /{" "}
          {id === "race"
            ? `${time.toFixed(1)}s`
            : id === "archery"
              ? `${shots}/3 ARROWS`
              : "YOUR TURN"}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "900", color: C.ink }}>
          {score}
        </Text>
      </View>
      {id === "price" ? (
        <View style={{ gap: 20, alignItems: "center", padding: 25 }}>
          <Text style={{ fontSize: 85 }}>{price.emoji}</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: C.ink }}>
            {price.name}
          </Text>
          <Text style={s.muted}>
            Illustrative price in USD • closest guess wins
          </Text>
          <TextInput
            accessibilityLabel="Price guess"
            keyboardType="numeric"
            value={guess}
            onChangeText={setGuess}
            placeholder="$ Your best guess"
            style={[s.input, { width: 260 }]}
            editable={!done}
          />
          {!done && (
            <Button
              disabled={
                !guess.trim() ||
                !Number.isFinite(Number(guess)) ||
                Number(guess) < 0
              }
              onPress={() => {
                setMessage(
                  "Guess locked. The price is revealed after everyone plays.",
                );
                finish(
                  Math.max(0, 100000 - Math.abs(Number(guess) - price.price)),
                );
              }}
            >
              Lock in guess
            </Button>
          )}
        </View>
      ) : (
        <Pressable
          accessibilityLabel="Game arena"
          onPress={action}
          disabled={done || id === "pool" || id === "wheel"}
          style={{
            width: W,
            height: H,
            backgroundColor: id === "pool" ? C.sage : C.blue,
            borderWidth: 2,
            borderColor: C.ink,
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          {id === "tower" && (
            <>
              {blocks.current.map((b, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    bottom: i * 22,
                    left: b.x,
                    width: b.w,
                    height: 22,
                    backgroundColor: i % 2 ? C.orange : C.yellow,
                    borderWidth: 1.5,
                    borderColor: C.ink,
                    borderRadius: 4,
                  }}
                />
              ))}
              {!done && (
                <View
                  style={{
                    position: "absolute",
                    bottom: blocks.current.length * 22,
                    left: movingX,
                    width: blocks.current.at(-1)!.w,
                    height: 22,
                    backgroundColor: C.ink,
                    borderRadius: 4,
                  }}
                />
              )}
              <Text
                style={{
                  position: "absolute",
                  top: 18,
                  left: 18,
                  color: C.ink,
                  fontWeight: "800",
                }}
              >
                TAP TO DROP ↓
              </Text>
            </>
          )}
          {id === "race" && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
              }}
            >
              <View
                style={{
                  transform: [{ translateX: Math.min(90, score * 2) - 45 }],
                }}
              >
                <Character {...player} size={110} />
              </View>
              <Text style={{ fontSize: 35, fontWeight: "900", color: C.ink }}>
                TAP! TAP! TAP!
              </Text>
              <View
                style={{
                  height: 10,
                  width: 240,
                  backgroundColor: C.paper,
                  borderRadius: 6,
                }}
              >
                <View
                  style={{
                    height: 10,
                    width: `${time * 10}%`,
                    backgroundColor: C.orange,
                    borderRadius: 6,
                  }}
                />
              </View>
            </View>
          )}
          {id === "flappy" && (
            <>
              <View
                style={{ position: "absolute", left: 60, top: bird.current.y }}
              >
                <Character {...player} size={28} />
              </View>
              <View
                style={{
                  position: "absolute",
                  left: bird.current.x,
                  top: 0,
                  width: 42,
                  height: Math.max(0, bird.current.gap - 65),
                  backgroundColor: C.orange,
                  borderBottomLeftRadius: 15,
                  borderBottomRightRadius: 15,
                  justifyContent: "flex-end",
                }}
              >
                <Text style={{ fontSize: 31 }}>🍕</Text>
              </View>
              <View
                style={{
                  position: "absolute",
                  left: bird.current.x,
                  top: bird.current.gap + 65,
                  bottom: 0,
                  width: 42,
                  backgroundColor: C.yellow,
                  borderTopLeftRadius: 15,
                  borderTopRightRadius: 15,
                }}
              >
                <Text style={{ fontSize: 31 }}>🍔</Text>
              </View>
              <Text
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 20,
                  fontWeight: "800",
                  color: C.ink,
                }}
              >
                TAP TO FLAP
              </Text>
            </>
          )}
          {id === "archery" && (
            <>
              {[210, 160, 110, 60, 15].map((d, i) => (
                <View
                  key={d}
                  style={{
                    position: "absolute",
                    left: 150 - d / 2,
                    top: 155 - d / 2,
                    width: d,
                    height: d,
                    borderRadius: d / 2,
                    backgroundColor: [
                      C.paper,
                      C.ink,
                      C.blue,
                      C.orange,
                      C.yellow,
                    ][i],
                  }}
                />
              ))}
              <Text
                style={{
                  position: "absolute",
                  left: 150 + Math.sin(t.current * 2.9) * 110 - 12,
                  top: 155 + Math.cos(t.current * 3.7) * 105 - 20,
                  fontSize: 32,
                  color: C.ink,
                }}
              >
                ＋
              </Text>
              {shots > 0 && (
                <Text
                  style={{
                    position: "absolute",
                    left: arrow.current.x - 8,
                    top: arrow.current.y - 12,
                    fontSize: 24,
                  }}
                >
                  ✕
                </Text>
              )}
            </>
          )}
          {id === "pool" && (
            <>
              <View
                style={{
                  position: "absolute",
                  inset: 8,
                  borderWidth: 10,
                  borderColor: C.ink,
                  borderRadius: 18,
                }}
              />
              {[
                [20, 20],
                [280, 20],
                [20, 310],
                [280, 310],
              ].map(([x, y], i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: x - 12,
                    top: y - 12,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: C.ink,
                  }}
                />
              ))}
              {!objectBall.current.pocketed && (
                <View
                  style={{
                    position: "absolute",
                    left: objectBall.current.x - 12,
                    top: objectBall.current.y - 12,
                    width: 24,
                    height: 24,
                    backgroundColor: C.orange,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: C.ink,
                  }}
                />
              )}
              {!shot.current.active && !done && (
                <View
                  style={{
                    position: "absolute",
                    left: 55,
                    top: 240,
                    width: 210,
                    height: 2,
                    backgroundColor: C.paper,
                    transformOrigin: "left",
                    transform: [{ rotate: `${aim - 45}deg` }],
                  }}
                />
              )}
              <View
                style={{
                  position: "absolute",
                  left: shot.current.x - 10,
                  top: shot.current.y - 10,
                  width: 20,
                  height: 20,
                  backgroundColor: C.paper,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.ink,
                }}
              />
            </>
          )}
          {id === "wheel" && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 30, color: C.ink }}>▼</Text>
              <Animated.View
                style={{
                  width: 230,
                  height: 230,
                  borderRadius: 115,
                  backgroundColor: C.yellow,
                  borderWidth: 8,
                  borderColor: C.ink,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 1800],
                        outputRange: ["0deg", "1800deg"],
                      }),
                    },
                  ],
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      width: 210,
                      height: 3,
                      backgroundColor: C.ink,
                      transform: [{ rotate: `${i * 45}deg` }],
                    }}
                  />
                ))}
                <View
                  style={{
                    width: 70,
                    height: 70,
                    backgroundColor: C.orange,
                    borderWidth: 3,
                    borderColor: C.ink,
                    borderRadius: 35,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 30 }}>✳</Text>
                </View>
              </Animated.View>
            </View>
          )}
        </Pressable>
      )}
      {id === "pool" && !done && (
        <View style={{ gap: 10, width: 300 }}>
          <Text style={s.body}>
            Angle {aim - 45}° · Power {power}%
          </Text>
          <View style={s.row}>
            <Button
              secondary
              onPress={() => setAim((v) => Math.max(-45, v - 5))}
            >
              ↶ Aim
            </Button>
            <Button
              secondary
              onPress={() => setAim((v) => Math.min(90, v + 5))}
            >
              Aim ↷
            </Button>
          </View>
          <View style={s.row}>
            <Button
              secondary
              onPress={() => setPower((v) => Math.max(10, v - 10))}
            >
              −
            </Button>
            <Button
              secondary
              onPress={() => setPower((v) => Math.min(100, v + 10))}
            >
              +
            </Button>
            <Button
              disabled={shot.current.active}
              onPress={() => {
                buzz();
                const a = ((aim - 45) * Math.PI) / 180;
                shot.current = {
                  x: 55,
                  y: 240,
                  vx: Math.cos(a) * power * 6,
                  vy: Math.sin(a) * power * 6,
                  active: true,
                };
                setMessage("");
              }}
            >
              Shoot →
            </Button>
          </View>
        </View>
      )}
      {message && <Text style={s.body}>{message}</Text>}
      {done ? (
        <View style={{ gap: 14, width: "100%" }}>
          <Text style={[s.title, { textAlign: "center", fontSize: 28 }]}>
            {id === "price"
              ? "Guess locked."
              : `${score} ${id === "wheel" ? "luck points" : "points"}. Nice effort.`}
          </Text>
          <Button onPress={() => onDone(score)}>
            Save score & pass it on →
          </Button>
        </View>
      ) : (
        id !== "price" &&
        id !== "wheel" &&
        id !== "pool" && (
          <Text style={s.muted}>
            {id === "archery"
              ? "Tap the target to shoot"
              : id === "tower"
                ? `${Math.max(0, 20 - t.current).toFixed(0)} seconds left · tap to drop`
                : "Tap anywhere in the arena"}
          </Text>
        )
      )}
    </View>
  );
}
const instructions: Record<GameId, string> = {
  tower:
    "Tap to drop each moving block. Only the overlap stays. You have 20 seconds or 12 levels.",
  race: "Tap the arena as fast as you can for 10 seconds. Every tap counts.",
  price:
    "Guess the illustrative USD price. The smallest absolute error wins. No internet peeking.",
  flappy:
    "Tap to flap. Dodge the food columns. Every completed gate is a point.",
  wheel: "One spin. 1–100 luck points. Your wallet would like a big number.",
  pool: "Aim the white cue ball at the orange ball. Aim toward a corner pocket. Pocket orange for 100 points. Near misses score by distance. Scratches score zero.",
  archery:
    "The crosshair drifts. Tap to release an arrow near the centre. Three shots, up to 100 points each.",
};
