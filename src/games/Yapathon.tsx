import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Switch, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { type Player } from "../model";
import { pickTopic, secondsRemaining } from "../yapathon";
import { Button, C, s, buzz } from "../ui";
import { Badge, Burst } from "./shared";
import Sprite from "../render/Sprite";
import { Counter, Meter, Particles, StateCard } from "../render/fx";
import { useSfx } from "../render/sound";

type Outcome = { player: Player; won: boolean; topic: string };
const RECENT_KEY = "funsplit.yapRecent";

export default function Yapathon({
  players,
  onDone,
}: {
  players: Player[];
  onDone: (scores: Record<string, number>) => void;
}) {
  const [phase, setPhase] = useState<
    "intro" | "topic" | "prep" | "talk" | "result" | "final"
  >("intro");
  const [turn, setTurn] = useState(0);
  const [topic, setTopic] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(60);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [keepScore, setKeepScore] = useState(true);
  const deadline = useRef(0);
  const progress = useSharedValue(1);
  const pulse = useSharedValue(1);
  const reduced = useReducedMotion();
  const sound = useSfx();
  const player = players[turn];

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((v) => setRecent(v ? JSON.parse(v) : []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (phase !== "prep" && phase !== "talk") return;
    const tick = () => {
      const left = Math.max(0, deadline.current - Date.now());
      const shown = secondsRemaining(deadline.current);
      setSeconds(shown);
      progress.value = withTiming(left / (phase === "prep" ? 3000 : 60000), {
        duration: 100,
        easing: Easing.linear,
      });
      if (!left) {
        if (phase === "prep") beginTalking();
        else finishTurn(true);
      }
    };
    tick();
    const timer = setInterval(tick, 100);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [phase]);
  useEffect(() => {
    if (phase === "talk" && seconds <= 10 && !reduced)
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 280 }),
          withTiming(1, { duration: 280 }),
        ),
        -1,
        false,
      );
    else pulse.value = withTiming(1);
  }, [phase, seconds, reduced]);
  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  function chooseTopic() {
    const next = pickTopic(recent);
    const nextRecent = [next, ...recent.filter((v) => v !== next)].slice(0, 16);
    setTopic(next);
    setRecent(nextRecent);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent)).catch(
      () => {},
    );
    sound("whoosh");
  }
  function showTopic() {
    chooseTopic();
    setPhase("topic");
  }
  function prepare() {
    deadline.current = Date.now() + 3000;
    progress.value = 1;
    setSeconds(3);
    setPhase("prep");
  }
  function beginTalking() {
    deadline.current = Date.now() + 60000;
    progress.value = 1;
    setSeconds(60);
    setPhase("talk");
    sound("impact");
  }
  function finishTurn(won: boolean) {
    if (phase !== "talk") return;
    const result = { player, won, topic };
    setOutcomes((old) => [...old, result]);
    setPhase("result");
    sound(won ? "reward" : "fail");
    buzz(true);
  }
  function next() {
    if (turn + 1 >= players.length) setPhase("final");
    else {
      setTurn((v) => v + 1);
      setPhase("topic");
      chooseTopic();
    }
  }
  if (phase === "intro")
    return (
      <StateCard>
        <View style={{ alignItems: "center", gap: 16, paddingVertical: 12 }}>
          <Badge>ONE MINUTE · ONE TOPIC</Badge>
          <Sprite {...player} state="interacting" size={120} />
          <Text style={[s.title, { fontSize: 43, textAlign: "center" }]}>
            YAPATHON
          </Text>
          <Text style={[s.eyebrow, { textAlign: "center", color: C.orange }]}>
            ZERO EXCUSES. JUST YAP.
          </Text>
          <Text style={[s.body, { textAlign: "center", maxWidth: 440 }]}>
            Talk continuously for 60 seconds. Everyone else is the referee. No
            microphone, no recording—just honour, chaos and a very large stop
            button.
          </Text>
          <View style={[s.row, { justifyContent: "center" }]}>
            <Text style={s.body}>Keep a scoreboard</Text>
            <Switch
              value={keepScore}
              onValueChange={setKeepScore}
              trackColor={{ true: C.orange }}
            />
          </View>
          <Button onPress={showTopic}>START YAPPING →</Button>
        </View>
      </StateCard>
    );
  if (phase === "final") {
    const scores = Object.fromEntries(
      players.map((p) => [
        p.id,
        keepScore && outcomes.find((o) => o.player.id === p.id)?.won
          ? 1
          : keepScore
            ? 0
            : 1,
      ]),
    );
    return (
      <StateCard>
        <Burst />
        <Badge>THE YAP REPORT</Badge>
        <Text style={[s.title, { textAlign: "center" }]}>
          Words were said. Consequences follow.
        </Text>
        {outcomes.map((o) => (
          <View
            key={o.player.id}
            style={[
              s.card,
              s.row,
              { padding: 12, backgroundColor: o.won ? C.yellow : C.blue },
            ]}
          >
            <Sprite
              {...o.player}
              state={o.won ? "winning" : "losing"}
              size={48}
            />
            <Text style={[s.body, { flex: 1, fontWeight: "900" }]}>
              {o.player.name}
            </Text>
            <Text style={s.eyebrow}>
              {o.won ? "CERTIFIED YAPPER · +1" : "RAN OUT OF WORDS"}
            </Text>
          </View>
        ))}
        <Button onPress={() => onDone(scores)}>Save round results →</Button>
      </StateCard>
    );
  }
  if (phase === "result") {
    const won = outcomes[outcomes.length - 1]?.won;
    return (
      <StateCard>
        {won && <Burst />}
        <Particles
          event={outcomes.length}
          x={150}
          y={100}
          kind={won ? "confetti" : "dust"}
          color={won ? C.yellow : C.orange}
        />
        <View style={{ alignItems: "center", gap: 14 }}>
          <Sprite {...player} state={won ? "winning" : "losing"} size={120} />
          <Text style={[s.title, { fontSize: 30, textAlign: "center" }]}>
            {won
              ? "CERTIFIED PROFESSIONAL YAPPER."
              : [
                  "BRO RAN OUT OF WORDS 💀",
                  "THE YAPPING CAREER ENDS HERE.",
                  "SILENCE IS NOT AN OPTION.",
                ][turn % 3]}
          </Text>
          <Text style={s.body}>
            {won
              ? keepScore
                ? "+1 point. The mouth remains undefeated."
                : "No score, just eternal bragging rights."
              : "The council heard silence and showed no mercy."}
          </Text>
          <Button onPress={next}>
            {turn + 1 < players.length
              ? `Pass to ${players[turn + 1].name} →`
              : "See final scoreboard →"}
          </Button>
        </View>
      </StateCard>
    );
  }
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>
          {phase === "topic"
            ? "TOPIC DROP"
            : phase === "prep"
              ? "GET READY"
              : "KEEP TALKING"}
        </Badge>
        <Text style={s.eyebrow}>
          {turn + 1}/{players.length} · {player.name}
        </Text>
      </View>
      <View
        style={[
          s.card,
          {
            backgroundColor: C.yellow,
            alignItems: "center",
            minHeight: 210,
            justifyContent: "center",
          },
        ]}
      >
        <Sprite
          {...player}
          state={phase === "talk" ? "interacting" : "idle"}
          size={72}
        />
        <Text
          style={[
            s.title,
            { fontSize: 28, lineHeight: 34, textAlign: "center" },
          ]}
        >
          {topic}
        </Text>
      </View>
      {phase === "topic" ? (
        <>
          <Button secondary onPress={chooseTopic}>
            Give me another topic ↻
          </Button>
          <Button onPress={prepare}>Lock topic · start prep →</Button>
        </>
      ) : (
        <>
          <Animated.View
            style={[{ alignItems: "center" }, timerStyle]}
            accessibilityLabel="Yapathon timer"
          >
            <Counter
              value={seconds}
              label="s"
              size={64}
              color={seconds <= 10 ? C.orange : C.ink}
            />
          </Animated.View>
          <Meter
            progress={progress}
            color={seconds <= 10 ? C.orange : C.yellow}
          />
          {phase === "talk" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="They stopped"
              onPress={() => finishTurn(false)}
              style={{
                backgroundColor: C.orange,
                borderWidth: 3,
                borderColor: C.ink,
                borderRadius: 24,
                paddingVertical: 24,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.paper, fontWeight: "900", fontSize: 24 }}>
                THEY STOPPED!
              </Text>
            </Pressable>
          )}
          <Text style={[s.muted, { textAlign: "center" }]}>
            {phase === "prep"
              ? "Three seconds to collect your thoughts…"
              : "The room judges. The app records nothing."}
          </Text>
        </>
      )}
    </StateCard>
  );
}
