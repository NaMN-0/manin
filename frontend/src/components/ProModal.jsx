import { Lock, Crown } from "lucide-react";
import { NinjaEliteUpgrade } from "./NinjaIllustrations";
import { Link } from "react-router-dom";

export default function ProModal({ isOpen }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 5, 16, 0.95)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: 500,
          width: "100%",
          padding: 40,
          textAlign: "center",
          border: "1px solid var(--primary)",
          boxShadow: "0 0 50px rgba(14, 165, 233, 0.2)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <NinjaEliteUpgrade width={180} height={180} />
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
          Trial Complete
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Your 30-second intelligence window has closed. Upgrade to
          <span className="text-gradient" style={{ fontWeight: 800 }}>
            {" "}
            Sensei Pro{" "}
          </span>
          for unlimited access to real-time signals.
        </p>

        <Link
          to="/plans"
          className="btn btn-primary btn-lg glow-effect"
          style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
        >
          <Crown size={20} fill="currentColor" style={{ marginRight: 10 }} />
          Upgrade to Elite Status
        </Link>

        <Link to="/" className="btn btn-ghost" style={{ fontSize: 14 }}>
          Return to Home Base
        </Link>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <Lock size={12} /> Secure 256-bit Encryption
        </div>
      </div>
    </div>
  );
}
