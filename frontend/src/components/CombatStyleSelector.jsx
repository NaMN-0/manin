import { useState } from "react";
import { NinjaInitiate, NinjaMaster, NinjaDiamond } from "./NinjaIllustrations";
import { Shield, Swords, Crown, Check, Bell } from "lucide-react";

const STYLES = [
  {
    id: "genin",
    title: "Genin",
    subtitle: "The Path of Discipline",
    desc: "You are learning the way. Safety first. Alerts and education guide your strikes.",
    icon: Shield,
    Illustration: NinjaInitiate,
    color: "#0ea5e9",
    features: ["Guided alerts", "Risk-limited trades", "Learning resources"],
  },
  {
    id: "jonin",
    title: "Jonin",
    subtitle: "The Art of War",
    desc: "You command the battlefield. Strategy and execution are your weapons.",
    icon: Swords,
    Illustration: NinjaMaster,
    color: "#8b5cf6",
    features: ["Advanced scanners", "Custom strategies", "Full data access"],
  },
  {
    id: "kage",
    title: "Kage",
    subtitle: "The Shadow Master",
    desc: "You are the market itself. Speed, automation, and dominance define your reign.",
    icon: Crown,
    Illustration: NinjaDiamond,
    color: "#f59e0b",
    features: ["Automated protocols", "Real-time AI", "Zero latency execution"],
  },
];

const CombatStyleCard = ({ style, isSelected, onClick }) => {
  const Icon = style.icon;
  const { color } = style;

  // Helper for dynamic background color
  const getBgColor = () => {
    if (!isSelected) return "rgba(15,23,42,0.6)";
    if (color === "#0ea5e9") return "rgba(14,165,233, 0.08)";
    if (color === "#8b5cf6") return "rgba(139,92,246, 0.08)";
    return "rgba(245,158,11, 0.08)";
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: getBgColor(),
        border: `2px solid ${isSelected ? color : "rgba(148,163,184,0.15)"}`,
        borderRadius: 16,
        padding: 24,
        cursor: "pointer",
        transition: "all 0.3s",
        position: "relative",
        overflow: "hidden",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
      }}
    >
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={14} color="#000" strokeWidth={3} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} color={color} />
        </div>
        <div>
          <h3
            style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}
          >
            {style.title}
          </h3>
          <span
            style={{
              fontSize: 11,
              color: color,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {style.subtitle}
          </span>
        </div>
      </div>

      <div
        style={{ width: 100, height: 100, margin: "0 auto 16px", opacity: 0.8 }}
      >
        <style.Illustration width={100} height={100} />
      </div>

      <p
        style={{
          fontSize: 13,
          color: "#94a3b8",
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        {style.desc}
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
        {style.features.map((f, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              color: "#cbd5e1",
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: color,
              }}
            />{" "}
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function CombatStyleSelector({
  currentStyle,
  onSelect,
  onOptIn,
  optedIn,
}) {
  const [selected, setSelected] = useState(currentStyle || null);
  const [latestUpdatesOnly, setLatestUpdatesOnly] = useState(optedIn || false);

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
    if (onOptIn) {
      onOptIn(latestUpdatesOnly);
    }
  };

  return (
    <div style={{ padding: "0", margin: "0" }}>
      <h2
        style={{
          fontSize: 36,
          fontWeight: 900,
          textAlign: "left",
          marginBottom: 12,
          background: "linear-gradient(135deg, #fff, #94a3b8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Select Your Combat Style
      </h2>
      <p
        style={{
          textAlign: "left",
          color: "#94a3b8",
          marginBottom: 48,
          fontSize: 16,
          maxWidth: 600,
        }}
      >
        Choose how KAGE AI adapts to your trading personality. Each style
        unlocks specific tools and risk parameters.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 32,
          marginBottom: 48,
        }}
      >
        {STYLES.map((style) => (
          <CombatStyleCard
            key={style.id}
            style={style}
            isSelected={selected === style.id}
            onClick={() => setSelected(style.id)}
          />
        ))}
      </div>

      {/* Opt-in for updates */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 16,
          background: "rgba(15,23,42,0.5)",
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid rgba(148,163,184,0.1)",
        }}
      >
        <Bell size={16} color="#64748b" />
        <label
          style={{
            fontSize: 13,
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            checked={latestUpdatesOnly}
            onChange={(e) => setLatestUpdatesOnly(e.target.checked)}
            style={{ accentColor: "#0ea5e9" }}
          />
          Opt-in for latest updates only
        </label>
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            padding: "14px 48px",
            fontSize: 16,
            fontWeight: 800,
            borderRadius: 12,
            background: selected ? "var(--primary)" : "#1e293b",
            color: selected ? "#fff" : "#475569",
            border: "none",
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.3s",
            boxShadow: selected ? "0 0 30px rgba(14,165,233,0.3)" : "none",
          }}
        >
          Confirm Style
        </button>
      </div>
    </div>
  );
}
