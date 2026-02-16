import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Shield } from "lucide-react";
import TraderNinjaLogo from "../components/TraderNinjaLogo";

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth();

  if (loading) {
    return (
      <div className="page loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    // Always redirect to welcome as requested
    // intent/founder logic can be handled later if needed, but "default land to welcome" is primary.
    const intent = localStorage.getItem("user_intent");
    if (intent === "founder") {
      localStorage.removeItem("user_intent");
    }
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div
      className="page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--gradient-hero)",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        className="glass-card"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: "clamp(32px, 5vw, 48px) clamp(24px, 4vw, 40px)",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          animation: "fadeInUp 0.6s ease-out",
        }}
      >
        {/* Ninja logo */}
        <div
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            border: "1px solid var(--ninja-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "16px",
              background:
                "radial-gradient(circle at center, rgba(14, 165, 233, 0.2) 0%, transparent 70%)",
            }}
          />
          <TraderNinjaLogo style={{ width: 36, height: 36 }} />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Enter the <span className="text-gradient">Dojo</span>
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: 32,
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          Sign in to access penny stock intelligence
          <br />
          and unlock your trading edge.
        </p>

        <button
          className="btn btn-lg"
          onClick={signInWithGoogle}
          style={{
            width: "100%",
            background: "white",
            color: "#1a1a24",
            fontSize: 15,
            fontWeight: 600,
            boxShadow: "var(--shadow-md)",
            marginBottom: 16,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            marginTop: 24,
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          <Shield size={14} />
          Secured by Supabase. We never access your Google data.
        </div>
      </div>
    </div>
  );
}
