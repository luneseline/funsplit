import React, { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { C, s } from "./ui";
export function usePartyMusic() {
  const player = useAudioPlayer(require("../assets/audio/table-party.wav"));
  const [enabled, setEnabled] = useState(false),
    [error, setError] = useState("");
  const on = useRef(false);
  const status = useAudioPlayerStatus(player);
  useEffect(() => {
    if (status.error) {
      on.current = false;
      setEnabled(false);
      setError("Could not play music. Tap Music to retry.");
    }
  }, [status.error]);
  useEffect(() => {
    player.loop = true;
    player.volume = 0.23;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => setError("Audio unavailable on this device."));
    const sub = AppState.addEventListener("change", (v) => {
      if (v !== "active") player.pause();
      else if (on.current) player.play();
    });
    return () => sub.remove();
  }, [player]);
  function toggle() {
    try {
      if (on.current) player.pause();
      else player.play();
      on.current = !on.current;
      setEnabled(on.current);
      setError("");
    } catch {
      setError("Audio unavailable. Tap again to retry.");
    }
  }
  return { enabled, toggle, error };
}
export function MusicButton({
  music,
}: {
  music: ReturnType<typeof usePartyMusic>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={music.enabled ? "Mute music" : "Play music"}
      onPress={music.toggle}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1.5,
        borderColor: C.ink,
        borderRadius: 22,
        paddingHorizontal: 13,
        paddingVertical: 10,
        backgroundColor: music.enabled ? C.yellow : C.paper,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
          height: 14,
        }}
      >
        {[6, 13, 9, 14].map((h, i) => (
          <View
            key={i}
            style={{
              height: music.enabled ? h : 3,
              width: 3,
              borderRadius: 2,
              backgroundColor: C.ink,
            }}
          />
        ))}
      </View>
      <Text style={[s.eyebrow, { fontSize: 10, letterSpacing: 0.5 }]}>
        {music.enabled ? "VIBE ON" : "MUSIC OFF"}
      </Text>
    </Pressable>
  );
}
