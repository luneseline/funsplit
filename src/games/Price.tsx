import React, { useState } from "react";
import { View, Text, TextInput, Image, Pressable } from "react-native";
import { prices, type Player } from "../model";
import { Button, C, s } from "../ui";
import { Badge, Ready } from "./shared";
export default function Price({
  player,
  round,
  onDone,
}: {
  player: Player;
  round: number;
  onDone: (n: number) => void;
}) {
  const [ready, setReady] = useState(false),
    [guess, setGuess] = useState(""),
    [locked, setLocked] = useState(false),
    [photoFailed, setPhotoFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const item = prices[round % prices.length],
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
    <View style={{ gap: 16 }}>
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
          {photoFailed ? (
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
          <View style={{ position: "absolute", top: 14, left: 14 }}>
            <Badge color={C.paper}>REAL ITEM · REAL RETAIL</Badge>
          </View>
        </View>
        <View style={{ padding: 20, gap: 10, backgroundColor: C.paper }}>
          <Text style={[s.eyebrow, { color: C.orange }]}>{item.brand}</Text>
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
        <Button disabled={!valid} onPress={() => setLocked(true)}>
          Lock in guess
        </Button>
      )}
      <Text style={s.muted}>
        US retail snapshot · 10 Nov 2026 · before tax. Prices vary by market.
        Photo © Gucci. Source links appear in the final reveal.
      </Text>
    </View>
  );
}
