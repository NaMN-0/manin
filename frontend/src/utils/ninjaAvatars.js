// Common Palette
export const C = {
  skin: "#fca5a5", // pale red skin (or robotic)
  maskDark: "#0f172a",
  maskLight: "#334155",
  eyes: "white",
  primary: "#0ea5e9",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  gold: "#fbbf24",
  void: "#000000",
};

export const ALL_AVATARS = [
  { id: "rookie", Component: null, label: "The Rookie" }, // Component will be set in NinjaAvatars.jsx
  { id: "bull", Component: null, label: "The Bull" },
  { id: "bear", Component: null, label: "The Bear" },
  { id: "ghost", Component: null, label: "The Ghost" },
  { id: "algo", Component: null, label: "The Algo" },
  { id: "gold", Component: null, label: "The Sensei" },
  { id: "shadow", Component: null, label: "The Shadow" },
  { id: "viper", Component: null, label: "The Viper" },
  { id: "glitch", Component: null, label: "The Glitch" },
  { id: "zen", Component: null, label: "The Zen" },
];

export function getRandomAvatarId() {
  const idx = Math.floor(Math.random() * ALL_AVATARS.length);
  return ALL_AVATARS[idx].id;
}

export function getAvatarById(id) {
  return ALL_AVATARS.find((a) => a.id === id) || ALL_AVATARS[0];
}
