import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { View, Text, Pressable, AppState } from "react-native";
import { useAudioPlayer } from "expo-audio";
type Sound = "tap" | "impact" | "reward" | "whoosh" | "tick" | "fail";
const Context = createContext<{
  play: (s: Sound) => void;
  enabled: boolean;
  toggle: () => void;
}>({ play: () => {}, enabled: true, toggle: () => {} });
export function SoundProvider({ children }: any) {
  const tap = useAudioPlayer(require("../../assets/audio/tap.wav")),
    impact = useAudioPlayer(require("../../assets/audio/impact.wav")),
    reward = useAudioPlayer(require("../../assets/audio/reward.wav")),
    whoosh = useAudioPlayer(require("../../assets/audio/whoosh.wav")),
    tick = useAudioPlayer(require("../../assets/audio/tick.wav")),
    fail = useAudioPlayer(require("../../assets/audio/fail.wav"));
  const [enabled, setEnabled] = useState(true),
    on = useRef(true),
    last = useRef<Record<string, number>>({});
  const pool = { tap, impact, reward, whoosh, tick, fail };
  useEffect(() => {
    Object.values(pool).forEach((p) => (p.volume = 0.27));
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") Object.values(pool).forEach((p) => p.pause());
    });
    return () => sub.remove();
  }, []);
  function play(s: Sound) {
    if (
      !on.current ||
      Date.now() - (last.current[s] || 0) < (s === "tick" ? 65 : 45)
    )
      return;
    last.current[s] = Date.now();
    const p = pool[s];
    try {
      p.seekTo(0)
        .then(() => {
          if (on.current) p.play();
        })
        .catch(() => {});
    } catch {}
  }
  function toggle() {
    on.current = !on.current;
    setEnabled(on.current);
    if (!on.current) Object.values(pool).forEach((p) => p.pause());
  }
  return (
    <Context.Provider value={{ play, enabled, toggle }}>
      {children}
    </Context.Provider>
  );
}
export function useSfx() {
  return useContext(Context).play;
}
export function SoundButton() {
  const { enabled, toggle } = useContext(Context);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        enabled ? "Mute sound effects" : "Enable sound effects"
      }
      onPress={toggle}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#351E28",
        backgroundColor: enabled ? "#D7EFFF" : "#F9F8F2",
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: "900", color: "#351E28" }}>
        {enabled ? "SFX ON" : "SFX OFF"}
      </Text>
    </Pressable>
  );
}
