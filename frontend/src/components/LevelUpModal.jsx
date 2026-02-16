import { NinjaVictory } from "./NinjaIllustrations";
import { X, Award, Zap, TrendingUp } from "lucide-react";

export default function LevelUpModal({ level, rank, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5, 5, 10, 0.9)",
          backdropFilter: "blur(10px)",
          animation: "fadeIn 0.3s ease-out",
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 450,
          background: "var(--ninja-black)",
          border: "2px solid var(--primary)",
          borderRadius: 32,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 0 50px rgba(14, 165, 233, 0.3)",
          animation: "modalPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: "50%",
            padding: 8,
            cursor: "pointer",
            color: "white",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: 24 }}>
          <NinjaVictory width={160} height={160} />
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          RANK <span className="text-gradient">PROMOTED!</span>
        </h2>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 18,
            marginBottom: 32,
          }}
        >
          You have reached{" "}
          <strong style={{ color: "white" }}>Level {level}</strong>
          <br />
          Current Rank:{" "}
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>
            {rank}
          </span>
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 32,
            padding: 20,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Award size={20} color="var(--amber)" style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
              REWARDS
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>+500 $</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Zap size={20} color="var(--primary)" style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>DATA</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>UNLOCKED</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <TrendingUp
              size={20}
              color="var(--emerald)"
              style={{ marginBottom: 4 }}
            />
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
              STREAK
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>+15%</div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          CONTINUE MISSION
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPopIn {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
