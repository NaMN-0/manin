import { useState, useEffect } from "react";
import { NinjaMeditating, NinjaRocket, NinjaTeam } from "./NinjaIllustrations";
// Note: NinjaTeam might not exist yet in illustrations. I'll use multiple Ninjas if not.
// Actually, user wants "multiple ninjas working aggresively". I'll simulate it with layout.

const financeFacts = [
  "The Dutch East India Company was the first to issue stocks in 1602.",
  "The 'Buttonwood Agreement' in 1792 marked the birth of the New York Stock Exchange.",
  "The 1987 'Black Monday' saw the Dow Jones drop 22.6% in a single day.",
  "The term 'Bull' comes from the way a bull thrusts its horns up when attacking.",
  "The term 'Bear' comes from the way a bear swipes its paws down when attacking.",
  "Warren Buffett bought his first stock at the age of 11.",
  "The oldest continuously operating exchange is the Amsterdam Stock Exchange.",
  "The S&P 500 was introduced in 1957.",
  "Algorithmic trading accounts for over 70% of equity market trades.",
];

export default function NinjaLoader({ variant = "meditating" }) {
  const [factIndex, setFactIndex] = useState(0);
  const [isPoked, setIsPoked] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPoked) {
        setFactIndex((prev) => (prev + 1) % financeFacts.length);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isPoked]);

  const handlePoke = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 500);
    setFactIndex((prev) => (prev + 1) % financeFacts.length);
  };

  // Render based on variant
  const renderVisuals = () => {
    if (variant === "team") {
      return (
        <div style={{ position: "relative", height: 160, width: 200 }}>
          <div style={{ animation: "float 3s ease-in-out infinite" }}>
            <NinjaTeam width={200} height={160} />
          </div>
        </div>
      );
    }
    if (variant === "penny") {
      return (
        <div
          className={isPoked ? "shake" : ""}
          onClick={handlePoke}
          style={{ cursor: "pointer" }}
        >
          <NinjaRocket width={160} height={160} />
        </div>
      );
    }
    return (
      <div
        className={isPoked ? "shake" : ""}
        onClick={handlePoke}
        style={{ cursor: "pointer" }}
      >
        <NinjaMeditating width={140} height={140} />
      </div>
    );
  };

  const getText = () => {
    if (variant === "team") return "The Clan is Hunting...";
    if (variant === "penny") return "Scouring Low-Cap Gems...";
    return "Gathering Market Chi...";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        textAlign: "center",
        minHeight: 320,
      }}
    >
      <div style={{ marginBottom: 30 }}>{renderVisuals()}</div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--amber)",
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          animation: "pulseText 2s infinite",
        }}
      >
        {getText()}
      </div>

      <div
        key={factIndex}
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          fontStyle: "italic",
          maxWidth: 420,
          minHeight: 48,
          animation: "factFade 0.5s ease-out",
        }}
      >
        "{financeFacts[factIndex]}"
      </div>

      <style>{`
                @keyframes factFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
                @keyframes pulseText { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
                .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
            `}</style>
    </div>
  );
}
