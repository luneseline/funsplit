import Sprite from "../render/Sprite";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";
import { Backdrop } from "../render/Backdrop";
import { Particles, StateCard, Achievement } from "../render/fx";
import { useSfx } from "../render/sound";
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, Pressable } from "react-native";
import { prices, type Player } from "../model";
import { Button, C, s } from "../ui";
import { Badge, Ready } from "./shared";
export default function Price({
  player,
  round,
  itemId,
  onDone,
}: {
  player: Player;
  round: number;
  itemId?: string;
  onDone: (n: number) => void;
}) {
  const [ready, setReady] = useState(false),
    [guess, setGuess] = useState(""),
    [locked, setLocked] = useState(false),
    [photoFailed, setPhotoFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const float = useSharedValue(0),
    seal = useSharedValue(0),
    reduced = useReducedMotion(),
    sound = useSfx();
  useEffect(() => {
    if (ready && !reduced)
      float.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2400 }),
          withTiming(0, { duration: 2400 }),
        ),
        -1,
        false,
      );
    return () => cancelAnimation(float);
  }, [ready, reduced]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value * -5 },
      { scale: 1 + float.value * 0.015 },
    ],
  }));
  const sealStyle = useAnimatedStyle(() => ({
    opacity: seal.value,
    transform: [
      { scale: 1.5 - seal.value * 0.5 },
      { rotate: `${-16 + seal.value * 8}deg` },
    ],
  }));
  const item =
      prices.find((q) => q.id === itemId) || prices[round % prices.length],
    valid =
      guess.trim() !== "" &&
      /^\d+(\.\d{1,2})?$/.test(guess) &&
      Number(guess) <= 100000;
  if (!ready)
    return (
      <Ready
        player={player}
        description="A real designer piece. A very real price tag. Study the photo and details, then guess its US retail price before tax. Closest guess wins; answers stay hidden until the verdict."
        onReady={
          <Button onPress={() => setReady(true)}>
            I’m ready. Let’s play →
          </Button>
        }
      />
    );
  return (
    <StateCard>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Badge>THE LUXURY LINEUP</Badge>
        <Text style={s.eyebrow}>
          ITEM {(round % prices.length) + 1}/{prices.length}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: "#EAE9E6",
          borderWidth: 1.5,
          borderColor: C.ink,
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 215,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Backdrop theme="studio" height={215} />
          <Animated.View
            style={[
              {
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              },
              floatStyle,
            ]}
          >
            {!item.photo ? (
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 92 }}>{item.emoji}</Text>
                <Text style={s.eyebrow}>OFFLINE PRODUCT CARD</Text>
              </View>
            ) : photoFailed ? (
              <View style={{ padding: 25, gap: 10 }}>
                <Text style={s.body}>
                  The product photo couldn’t load. Internet access is needed for
                  designer photos.
                </Text>
                <Button
                  secondary
                  onPress={() => {
                    setPhotoFailed(false);
                    setAttempt((v) => v + 1);
                  }}
                >
                  Retry photo
                </Button>
              </View>
            ) : (
              <Image
                key={attempt}
                accessibilityLabel={`${item.brand} ${item.name} product photograph`}
                source={{ uri: item.photo }}
                resizeMode="contain"
                style={{ width: "100%", height: "100%" }}
                onError={() => setPhotoFailed(true)}
              />
            )}
          </Animated.View>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: 17,
              width: 175,
              height: 10,
              borderRadius: 100,
              backgroundColor: "#351E28",
              opacity: 0.08,
            }}
          />
          <Particles event={locked ? 1 : 0} x={150} y={100} />
          <View
            pointerEvents="none"
            style={{ position: "absolute", bottom: 9, right: 10 }}
          >
            <Sprite
              {...player}
              state={locked ? "winning" : "interacting"}
              size={44}
            />
          </View>
          {locked && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  padding: 12,
                  borderWidth: 3,
                  borderColor: C.orange,
                  borderRadius: 10,
                  backgroundColor: "#F9F8F2E8",
                },
                sealStyle,
              ]}
            >
              <Text
                style={{
                  color: C.orange,
                  fontWeight: "900",
                  letterSpacing: 4,
                  fontSize: 24,
                }}
              >
                SEALED
              </Text>
            </Animated.View>
          )}
          <View style={{ position: "absolute", top: 14, left: 14 }}>
            <Badge color={C.paper}>REAL ITEM · REAL RETAIL</Badge>
          </View>
        </View>
        <View style={{ padding: 20, gap: 10, backgroundColor: C.paper }}>
          <Text style={[s.eyebrow, { color: C.orange }]}>
            {item.brand} · {item.category.toUpperCase()} ·{" "}
            {item.difficulty.toUpperCase()}
          </Text>
          <Text style={[s.title, { fontSize: 27 }]}>{item.name}</Text>
          <Text style={s.body}>{item.description}</Text>
          <Text style={s.muted}>{item.details}</Text>
        </View>
      </View>
      <Text style={s.eyebrow}>WHAT’S THE DAMAGE? · USD</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 18,
          padding: 12,
          backgroundColor: C.yellow,
        }}
      >
        <Text style={{ fontSize: 35, fontWeight: "900", color: C.ink }}>$</Text>
        <TextInput
          accessibilityLabel="Price guess"
          keyboardType="decimal-pad"
          value={guess}
          maxLength={9}
          onChangeText={setGuess}
          editable={!locked}
          placeholder="0.00"
          style={{
            flex: 1,
            minWidth: 0,
            width: 0,
            fontSize: 35,
            fontWeight: "900",
            color: C.ink,
            paddingHorizontal: 12,
            paddingVertical: 2,
          }}
        />
      </View>
      {locked ? (
        <>
          <Achievement>GUESS LOCKED</Achievement>
          <Text style={s.body}>
            Sealed. No peeking at the price until everyone has guessed.
          </Text>
          <Button
            onPress={() =>
              onDone(
                Math.max(
                  0,
                  100000 - Math.round(Math.abs(Number(guess) - item.price)),
                ),
              )
            }
          >
            Save score & pass it on →
          </Button>
        </>
      ) : (
        <Button
          disabled={!valid}
          onPress={() => {
            setLocked(true);
            seal.value = withTiming(1, { duration: 240 });
            sound("impact");
          }}
        >
          Lock in guess
        </Button>
      )}
      <Text style={s.muted}>
        {item.snapshot}. Prices can change; the dated source link appears in the
        final reveal.
      </Text>
    </StateCard>
  );
}
