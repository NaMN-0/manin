import { Link } from "react-router-dom";
import { Zap, ArrowRight, Shield, Target, Award } from "lucide-react";
import {
  NinjaCharting,
  NinjaRocket,
  NinjaZen,
  NinjaDojo,
} from "../components/NinjaIllustrations";

export default function Onboarding() {
  return (
    <div className="page" style={{ paddingBottom: 80, overflowX: "hidden" }}>
      {/* Background Decor */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.1) 0%, transparent 60%)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      {/* Hero Section */}
      <div
        style={{
          position: "relative",
          padding: "80px 0 60px",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              marginBottom: 24,
              display: "inline-block",
              position: "relative",
            }}
          >
            {/* Glow behind ninja */}
            <div
              style={{
                position: "absolute",
                inset: -20,
                background:
                  "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)",
                filter: "blur(20px)",
                zIndex: 0,
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <NinjaDojo width={140} height={140} />
            </div>
          </div>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              marginBottom: 16,
              lineHeight: 1,
            }}
          >
            Welcome to the <span className="text-gradient">Dojo.</span>
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
          >
            The path to market mastery starts here. Master these three tools to
            find your edge.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800 }}>
        {/* TIMELINE STEPS */}
        <div style={{ position: "relative", paddingLeft: 40 }}>
          {/* Vertical Line */}
          <div
            style={{
              position: "absolute",
              top: 20,
              bottom: 20,
              left: 19,
              width: 2,
              background:
                "linear-gradient(to bottom, var(--primary) 0%, var(--primary) 50%, transparent 100%)",
              zIndex: 0,
            }}
          />

          {/* Step 1: Market Overview */}
          <div
            style={{
              position: "relative",
              marginBottom: 60,
              animation: "fadeInRight 0.5s ease-out",
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: -40,
                top: 20,
                width: 40,
                height: 40,
                background: "#0f172a",
                border: "2px solid var(--emerald)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--emerald)" }}>
                1
              </span>
            </div>

            <Link
              to="/market"
              className="glass-card"
              style={{
                display: "flex",
                gap: 32,
                padding: 32,
                textDecoration: "none",
                borderLeft: "4px solid var(--emerald)",
                alignItems: "center",
                flexDirection: "row",
                transition: "transform 0.2s",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: "white",
                  }}
                >
                  Tactical Reconnaissance
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  Start at the <strong>Market Overview</strong>. See what's
                  moving real-time and analyze any ticker for an instant AI
                  scorecard.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--emerald)",
                    fontWeight: 600,
                  }}
                >
                  Perform Scan <ArrowRight size={16} />
                </div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 20,
                  background: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NinjaCharting width={120} height={120} />
              </div>
            </Link>
          </div>

          {/* Step 2: Penny Stocks */}
          <div
            style={{
              position: "relative",
              marginBottom: 60,
              animation: "fadeInRight 0.5s ease-out 0.2s backwards",
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: -40,
                top: 20,
                width: 40,
                height: 40,
                background: "#0f172a",
                border: "2px solid var(--amber)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--amber)" }}>2</span>
            </div>

            <Link
              to="/penny"
              className="glass-card"
              style={{
                display: "flex",
                gap: 32,
                padding: 32,
                textDecoration: "none",
                borderLeft: "4px solid var(--amber)",
                alignItems: "center",
                flexDirection: "row-reverse",
                transition: "transform 0.2s",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: "white",
                  }}
                >
                  High Priority Operations
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  Visit <strong>Penny Stocks</strong> to see curated lists of
                  huge movers. High risk, but high reward for the disciplined
                  ninja.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--amber)",
                    fontWeight: 600,
                  }}
                >
                  Hunt Gems <ArrowRight size={16} />
                </div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 20,
                  background: "rgba(245, 158, 11, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NinjaRocket width={120} height={120} />
              </div>
            </Link>
          </div>

          {/* Step 3: Pro Intelligence */}
          <div
            style={{
              position: "relative",
              marginBottom: 60,
              animation: "fadeInRight 0.5s ease-out 0.4s backwards",
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: -40,
                top: 20,
                width: 40,
                height: 40,
                background: "#0f172a",
                border: "2px solid var(--primary)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <span style={{ fontWeight: 800, color: "var(--primary)" }}>
                3
              </span>
            </div>

            <Link
              to="/pro"
              className="glass-card"
              style={{
                display: "flex",
                gap: 32,
                padding: 32,
                textDecoration: "none",
                borderLeft: "4px solid var(--primary)",
                background:
                  "linear-gradient(90deg, rgba(14, 165, 233, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%)",
                alignItems: "center",
                flexDirection: "row",
                transition: "transform 0.2s",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: "white",
                  }}
                >
                  Expert Intelligence
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  The <strong>Command Center</strong> (Pro) is your ultimate
                  weapon. Let AI find the highest probability trades for you
                  instantly.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  Enter Command Center <ArrowRight size={16} />
                </div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 20,
                  background: "rgba(14, 165, 233, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NinjaZen width={120} height={120} />
              </div>
            </Link>
          </div>
        </div>

        {/* Dictionary Section - Holographic Upgrade */}
        <div
          style={{
            marginTop: 120,
            padding: 2,
            borderRadius: 32,
            background:
              "linear-gradient(135deg, rgba(14, 165, 233, 0.5), rgba(16, 185, 129, 0.1))",
            boxShadow: "0 0 40px rgba(14, 165, 233, 0.1)",
          }}
        >
          <div
            style={{
              background: "#050510",
              borderRadius: 30,
              padding: 60,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background Grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.1,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
                marginBottom: 40,
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <NinjaDojo width={80} height={80} />
              </div>
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  fontFamily: "monospace",
                  letterSpacing: "-1px",
                }}
              >
                &lt;DECRYPTION_KEYS /&gt;
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "monospace",
                }}
              >
                Master the terminology of the algorithm.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {[
                {
                  icon: Award,
                  label: "AI_SCORE",
                  color: "var(--sky)",
                  desc: "Confidence rating (0-100%). >80% is a verified signal.",
                },
                {
                  icon: Target,
                  label: "UPSIDE_POTENTIAL",
                  color: "var(--emerald)",
                  desc: "Calculated profit runway before resistance.",
                },
                {
                  icon: Zap,
                  label: "VOLUME_VELOCITY",
                  color: "var(--amber)",
                  desc: "Rate of buying pressure. High velocity = breakout imminent.",
                },
                {
                  icon: Shield,
                  label: "RSI_HEATMAP",
                  color: "var(--crimson)",
                  desc: "Momentum indicator. >70 Overbought, <30 Oversold.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: 24,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ color: item.color, marginTop: 4 }}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 4,
                        fontFamily: "monospace",
                        color: "white",
                      }}
                    >
                      {item.label}
                    </h4>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @media (max-width: 768px) {
                    .container h1 { line-height: 1.1 !important; }
                    
                    .glass-card[style*="flex-direction: row"],
                    .glass-card[style*="flex-direction: row-reverse"] {
                        flex-direction: column !important;
                        gap: 16px !important;
                        padding: 24px !important;
                    }
                    
                    div[style*="padding: 60"] {
                        padding: 24px !important;
                    }
                }
            `}</style>
    </div>
  );
}
