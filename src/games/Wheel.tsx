import React, { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { type Player } from "../model";
import { Button, C, s, buzz } from "../ui";
import { Badge, Burst } from "./shared";
import { Particles, StateCard } from "../render/fx";
import { useSfx } from "../render/sound";
import Sprite from "../render/Sprite";
import {
  createDoomDeck,
  shuffle,
  type DoomCardData as CardData,
} from "../wheel";

const colors = [
  C.yellow,
  C.orange,
  C.blue,
  C.sage,
  "#F5B8CD",
  "#FFD58B",
  "#BFC8FF",
  "#D9F0C0",
];

export default function Wheel({
  players,
  onDone,
}: {
  players: Player[];
  onDone: (scores: Record<string, number>) => void;
}) {
  const [phase, setPhase] = useState<
    "intro" | "spinning" | "cards" | "results"
  >("intro");
  const [selected, setSelected] = useState<number | null>(null);
  const [order, setOrder] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [cards, setCards] = useState<CardData[]>([]);
  const [event, setEvent] = useState(0);
  const rotation = useSharedValue(0),
    needle = useSharedValue(0);
  const sound = useSfx(),
    reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const disc = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const pointer = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needle.value}deg` }],
  }));
  const size = Math.min(300, width - 46);
  function finishSpin(index: number) {
    const first = players[index];
    setSelected(index);
    setOrder([first, ...shuffle(players.filter((_, i) => i !== index))]);
    setCards(createDoomDeck(players.length));
    setTurn(0);
    setPhase("cards");
    setEvent((v) => v + 1);
    sound("reward");
    buzz(true);
  }
  function spin() {
    if (phase === "spinning") return;
    setPhase("spinning");
    const index = Math.floor(Math.random() * players.length),
      arc = 360 / players.length,
      target = 2160 - (index + 0.5) * arc;
    sound("whoosh");
    if (!reduced)
      needle.value = withSequence(
        withTiming(-12, { duration: 100 }),
        withSpring(0),
      );
    rotation.value = withTiming(
      target,
      { duration: reduced ? 450 : 3400, easing: Easing.out(Easing.cubic) },
      (ok) => {
        if (ok) runOnJS(finishSpin)(index);
      },
    );
  }
  function pick(index: number) {
    if (phase !== "cards" || cards[index].playerId) return;
    const player = order[turn];
    setCards(
      cards.map((card, i) =>
        i === index ? { ...card, playerId: player.id } : card,
      ),
    );
    setEvent((v) => v + 1);
    sound(cards[index].doom ? "fail" : "reward");
    buzz(cards[index].doom);
    if (turn + 1 === players.length) setTimeout(() => setPhase("results"), 750);
    else setTurn((v) => v + 1);
  }
  function replay() {
    setSelected(null);
    setOrder([]);
    setCards([]);
    setTurn(0);
    rotation.value = 0;
    setPhase("intro");
  }
  const doomedCard = cards.find((c) => c.doom && c.playerId),
    doomed = players.find((p) => p.id === doomedCard?.playerId);
  if (phase === "results") {
    const scores = Object.fromEntries(
      players.map((p) => [p.id, p.id === doomed?.id ? 0 : 100]),
    );
    return (
      <StateCard>
        <Burst />
        <Badge>THE DOOM REPORT</Badge>
        <View style={{ alignItems: "center", gap: 12 }}>
          {doomed && <Sprite {...doomed} state="losing" size={125} />}
          <Text style={[s.title, { textAlign: "center", fontSize: 34 }]}>
            {doomed?.name}, THE CARD CHOSE YOU.
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>
            Please direct all complaints to fate, your own hand, and whoever
            shuffled.
          </Text>
        </View>
        {cards.map((card) => {
          const p = players.find((v) => v.id === card.playerId)!;
          return (
            <View
              key={card.id}
              style={[
                s.card,
                s.row,
                { padding: 11, backgroundColor: card.doom ? C.orange : C.blue },
              ]}
            >
              <Sprite
                {...p}
                state={card.doom ? "losing" : "winning"}
                size={42}
              />
              <Text style={[s.body, { flex: 1, fontWeight: "900" }]}>
                {p.name}
              </Text>
              <Text style={s.eyebrow}>{card.doom ? "DOOM" : "SAFE"}</Text>
            </View>
          );
        })}
        <Button secondary onPress={replay}>
          Play again with this crew ↻
        </Button>
        <Button onPress={() => onDone(scores)}>Save round results →</Button>
      </StateCard>
    );
  }
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>WHEEL OF OWE</Badge>
        <Text style={s.eyebrow}>{players.length} PLAYERS · 1 DOOM</Text>
      </View>
      {phase === "cards" ? (
        <>
          <View
            style={[
              s.card,
              { backgroundColor: C.yellow, alignItems: "center", padding: 14 },
            ]}
          >
            <Text style={s.eyebrow}>
              {turn === 0
                ? "THE WHEEL CHOSE FIRST PICK"
                : `PICK ${turn + 1} OF ${players.length}`}
            </Text>
            <View style={s.row}>
              <Sprite {...order[turn]} state="interacting" size={56} />
              <Text style={[s.title, { fontSize: 25 }]}>
                {order[turn].name}, choose a card.
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {cards.map((card, i) => (
              <DoomCard
                key={card.id}
                card={card}
                player={players.find((p) => p.id === card.playerId)}
                onPress={() => pick(i)}
                width={players.length > 6 ? 88 : players.length > 4 ? 105 : 125}
              />
            ))}
          </View>
          <Text style={[s.muted, { textAlign: "center" }]}>
            Cards reveal immediately. Hidden cards stay hidden. Every player
            gets exactly one choice.
          </Text>
        </>
      ) : (
        <>
          <View
            accessibilityLabel="Game arena"
            testID="scene-wheel"
            style={{
              width: size,
              height: size + 34,
              alignSelf: "center",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View style={disc}>
              <Svg width={size} height={size} viewBox="-130 -130 260 260">
                {players.map((player, i) => {
                  const arc = 360 / players.length,
                    a = ((i * arc - 90) * Math.PI) / 180,
                    b = (((i + 1) * arc - 90) * Math.PI) / 180,
                    mid = (a + b) / 2;
                  return (
                    <G key={player.id}>
                      <Path
                        d={`M0 0 L${122 * Math.cos(a)} ${122 * Math.sin(a)} A122 122 0 0 1 ${122 * Math.cos(b)} ${122 * Math.sin(b)} Z`}
                        fill={colors[i % colors.length]}
                        stroke={C.ink}
                        strokeWidth="2"
                      />
                      <SvgText
                        x={77 * Math.cos(mid)}
                        y={77 * Math.sin(mid) + 4}
                        textAnchor="middle"
                        fontSize={players.length > 6 ? 10 : 13}
                        fontWeight="900"
                        fill={C.ink}
                      >
                        {player.name.slice(0, 10)}
                      </SvgText>
                    </G>
                  );
                })}
                <Circle r="24" fill={C.ink} />
                <SvgText
                  y="7"
                  textAnchor="middle"
                  fontSize="22"
                  fill={C.yellow}
                >
                  ✳
                </SvgText>
              </Svg>
            </Animated.View>
            <Animated.View style={[{ position: "absolute", top: 0 }, pointer]}>
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 15,
                  borderRightWidth: 15,
                  borderTopWidth: 30,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: C.orange,
                }}
              />
            </Animated.View>
            <Particles
              event={event}
              x={size / 2}
              y={size / 2}
              kind="confetti"
            />
          </View>
          {selected !== null && (
            <Text style={[s.title, { fontSize: 27, textAlign: "center" }]}>
              {players[selected].name} gets first pick!
            </Text>
          )}
          <Button disabled={phase === "spinning"} onPress={spin}>
            {phase === "spinning" ? "Fate is deciding…" : "SPIN THE WHEEL ↻"}
          </Button>
          <Text style={[s.muted, { textAlign: "center" }]}>
            Every name has one equal segment. One spin, one random result, no
            repeat taps.
          </Text>
        </>
      )}
    </StateCard>
  );
}

function DoomCard({
  card,
  player,
  onPress,
  width,
}: {
  card: CardData;
  player?: Player;
  onPress: () => void;
  width: number;
}) {
  const flip = useSharedValue(card.playerId ? 1 : 0);
  useEffect(() => {
    if (card.playerId)
      flip.value = withTiming(1, {
        duration: 520,
        easing: Easing.inOut(Easing.cubic),
      });
  }, [card.playerId]);
  const front = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 700 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const back = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [
      { perspective: 700 },
      { rotateY: `${(flip.value - 1) * 180}deg` },
    ],
  }));
  const base = {
    width,
    height: 158,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: C.ink,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 10,
    backfaceVisibility: "hidden" as const,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        card.playerId
          ? `${player?.name} revealed ${card.doom ? "doom" : "safe"}`
          : "Face-down card"
      }
      disabled={!!card.playerId}
      onPress={onPress}
      style={{ width, height: 158 }}
    >
      <Animated.View
        style={[base, { position: "absolute", backgroundColor: C.ink }, front]}
      >
        <Text style={{ color: C.yellow, fontSize: 42 }}>?</Text>
        <Text style={[s.eyebrow, { color: C.paper, textAlign: "center" }]}>
          PICK YOUR FATE
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          base,
          {
            position: "absolute",
            backgroundColor: card.doom ? C.orange : C.blue,
          },
          back,
        ]}
      >
        <Text style={{ fontSize: 26 }}>{card.doom ? "☠" : "✦"}</Text>
        <Text style={[s.eyebrow, { textAlign: "center", color: C.ink }]}>
          {card.message}
        </Text>
        {player && (
          <Text style={[s.muted, { marginTop: 7, textAlign: "center" }]}>
            {player.name}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
