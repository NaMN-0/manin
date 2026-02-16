import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import {
  NinjaSceneVoid,
  NinjaSceneSwarm,
  NinjaSceneAlgo,
  NinjaHeroIdle,
  NinjaHeroScanning,
  NinjaHeroDash,
  NinjaHeroShield,
  NinjaHeroVictory,
  NinjaHeroGlitch,
  NinjaDiamond,
  NinjaMaster,
  NinjaInitiate,
} from "../components/NinjaIllustrations";
import { ArrowRight, MousePointer2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";

// 🌧️ MATRIX RAIN
const DigitalRain = ({ intensity = 1 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const columns = Math.floor(window.innerWidth / 20);
    const drops = Array(columns).fill(1);
    const chars = "0101BUYSELL█▓▒░";
    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.fillStyle = `rgba(5, 5, 16, ${0.1 * intensity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0ea5e9";
      ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) {
        ctx.fillText(
          chars[Math.floor(Math.random() * chars.length)],
          i * 20,
          drops[i] * 20,
        );
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975)
          drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, opacity: 0.2 * intensity }}
    />
  );
};

// 📜 SECTION
const ScrollSection = ({ children, style, className = "" }) => (
  <div
    className={`scroll-section ${className}`}
    style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      padding: "80px 24px",
      boxSizing: "border-box",
      scrollSnapAlign: "start",
      ...style,
    }}
  >
    {children}
  </div>
);

// 🥷 MANIN COMPANION
const ManinCompanion = ({ state, message }) => {
  const [visibleMessage, setVisibleMessage] = useState("");
  useEffect(() => {
    if (!message) {
      setVisibleMessage("");
      return;
    }
    let idx = 0;
    setVisibleMessage("");
    const timer = setInterval(() => {
      if (idx < message.length) {
        const charIdx = idx;
        setVisibleMessage((prev) => prev + message.charAt(charIdx));
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [message]);

  let Component = NinjaHeroIdle;
  if (state === "scanning") Component = NinjaHeroScanning;
  if (state === "dash") Component = NinjaHeroDash;
  if (state === "shield") Component = NinjaHeroShield;
  if (state === "victory") Component = NinjaHeroVictory;
  if (state === "glitch") Component = NinjaHeroGlitch;

  return (
    <div
      className="manin-companion"
      style={{
        position: "fixed",
        bottom: 40,
        right: 40,
        zIndex: 60,
        pointerEvents: "none",
        transition: "all 0.5s",
        transform: state === "dash" ? "translateX(-50vw)" : "none",
      }}
    >
      {visibleMessage && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: 16,
            background: "rgba(15,23,42,0.9)",
            border: "1px solid #0ea5e9",
            borderRadius: 16,
            padding: 24,
            width: 260,
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 30px rgba(14,165,233,0.3)",
            pointerEvents: "auto",
            animation: "fadeInUp 0.4s ease-out",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              color: "#0ea5e9",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            SENSEI SAYS
          </p>
          <p
            style={{
              color: "white",
              fontSize: 16,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            {visibleMessage}
            <span style={{ animation: "blink 1s infinite" }}>_</span>
          </p>
          <div
            style={{
              position: "absolute",
              bottom: -8,
              right: 32,
              width: 16,
              height: 16,
              background: "rgba(15,23,42,0.9)",
              borderRight: "1px solid #0ea5e9",
              borderBottom: "1px solid #0ea5e9",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}
      <div
        style={{
          width: 120,
          height: 120,
          filter: "drop-shadow(0 0 20px rgba(14,165,233,0.4))",
        }}
      >
        <Component width="100%" height="100%" />
      </div>
    </div>
  );
};

import { usePostHog } from "posthog-js/react";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [currentScene, setCurrentScene] = useState(0);
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("viewed_landing");

    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setCurrentScene(Math.min(5, Math.floor(progress * 6)));
    };
    const el = containerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
    };
  }, [posthog]);

  const handleGetStarted = () => {
    posthog?.capture("clicked_get_started", {
      user_status: user ? "logged_in" : "guest",
    });
    navigate(user ? "/market" : "/login");
  };

  const scenes = useMemo(
    () => [
      {
        bg: "#050510",
        manin: "idle",
        text: "Welcome, initiate. The market is a battlefield, and noise is your enemy.",
      },
      {
        bg: "#1a0505",
        manin: "shield",
        text: "95% of traders fall because they lack discipline and follow the crowd.",
      },
      {
        bg: "#0f172a",
        manin: "scanning",
        text: "Here at the Academy, our AI Sensei scans thousands of scrolls to find high-probability strikes.",
      },
      {
        bg: "#051a1a",
        manin: "dash",
        text: "We don't guess. We analyze patterns, volume, and momentum with lethal precision.",
      },
      {
        bg: "#050510",
        manin: "victory",
        text: "Gather intelligence, complete missions, and master the art of the trade.",
      },
      {
        bg: "#0f172a",
        manin: "victory",
        text: "Your training begins now. Are you ready to become a Shadow Master?",
      },
    ],
    [],
  );

  const activeConfig = scenes[currentScene] || scenes[0];

  return (
    <div
      className="landing-container"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#050510",
        color: "white",
        fontFamily: "var(--font-sans)",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Fixed BG */}
      <div
        className="landing-bg"
        style={{
          position: "absolute",
          inset: 0,
          transition: "background-color 1s ease",
          zIndex: 0,
          backgroundColor: activeConfig.bg,
        }}
      >
        <DigitalRain
          intensity={currentScene === 0 ? 0.5 : currentScene === 1 ? 1.5 : 0.3}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.8,
            background:
              "linear-gradient(to top, #050510, transparent, transparent)",
          }}
        />
      </div>

      <ManinCompanion state={activeConfig.manin} message={activeConfig.text} />

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="scroll-container"
        style={{
          height: "100%",
          width: "100%",
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          position: "relative",
          zIndex: 10,
          scrollBehavior: "smooth",
        }}
      >
        {/* ═══ SCENE 1: HOOK ═══ */}
        <ScrollSection>
          <div
            style={{
              textAlign: "center",
              position: "relative",
              maxWidth: 800,
              padding: "0 24px",
            }}
          >
            <div
              style={{
                width: 320,
                maxWidth: "70vw",
                height: 320,
                maxHeight: "40vh",
                margin: "0 auto 40px",
                animation: "float 6s ease-in-out infinite",
              }}
            >
              <NinjaSceneVoid width="100%" height="100%" />
            </div>
            <h1
              style={{
                fontSize: "clamp(40px, 7vw, 80px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                marginBottom: 24,
                lineHeight: 1.05,
                background: "linear-gradient(to bottom right, #fff, #64748b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <span style={{ WebkitTextFillColor: "#0ea5e9" }}>KAGE</span>
              <br />
              AI INTELLIGENCE HUB
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.6,
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              Master the markets through AI-led missions. Precise signals,
              concrete reasoning, and gamified growth.
            </p>
            <div
              style={{
                position: "absolute",
                bottom: -60,
                left: "50%",
                transform: "translateX(-50%)",
                opacity: 0.4,
                animation: "bounce 2s infinite",
              }}
            >
              <MousePointer2 size={28} />
            </div>
          </div>
        </ScrollSection>

        {/* ═══ SCENE 2: THE PROBLEM ═══ */}
        <ScrollSection>
          <div
            className="scene-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 48,
              maxWidth: 1100,
              width: "100%",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  fontWeight: 800,
                  marginBottom: 20,
                  color: "#ef4444",
                  lineHeight: 1.1,
                }}
              >
                The Battlefield is
                <br />
                Designed to Confuse.
              </h2>
              <p
                style={{
                  fontSize: "clamp(15px, 1.8vw, 20px)",
                  color: "#cbd5e1",
                  lineHeight: 1.7,
                }}
              >
                Hype gurus and fake news are the smoke screens of the market.
                <br />
                Without a{" "}
                <span style={{ color: "#ef4444", fontWeight: 600 }}>
                  Strike Plan
                </span>
                , you are just an initiate in the line of fire.
                <br />
                We provide the vision to see through the fog.
              </p>
            </div>
            <div
              style={{
                maxWidth: 420,
                margin: "0 auto",
                animation: "shake 0.5s linear infinite",
              }}
            >
              <NinjaSceneSwarm width="100%" height="100%" />
            </div>
          </div>
        </ScrollSection>

        {/* ═══ SCENE 3: THE SOLUTION ═══ */}
        <ScrollSection>
          <div
            className="scene-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 48,
              maxWidth: 1100,
              width: "100%",
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: 420, margin: "0 auto" }}>
              <NinjaSceneAlgo width="100%" height="100%" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  fontWeight: 800,
                  marginBottom: 20,
                  color: "#10b981",
                  lineHeight: 1.1,
                }}
              >
                Deploy AI Sensei
                <br />
                For Your Missions.
              </h2>
              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "clamp(15px, 1.8vw, 20px)",
                  lineHeight: 1.7,
                }}
              >
                Our intelligence engine screens{" "}
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  thousands of assets
                </span>{" "}
                daily.
                <br />
                It identifies 'Spring' patterns, liquidity sweeps, and massive
                volume anomalies.
                <br />
                Every signal comes with clear, concrete reasoning. No more
                second-guessing.
              </p>
            </div>
          </div>
        </ScrollSection>

        {/* ═══ SCENE 4: THREE PATHS ═══ */}
        <ScrollSection>
          <div style={{ maxWidth: 1280, width: "100%" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 900,
                textAlign: "center",
                marginBottom: 48,
                lineHeight: 1.1,
              }}
            >
              Choose Your <span style={{ color: "#0ea5e9" }}>Dojo Path</span>
            </h2>

            <div
              className="paths-grid"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
                justifyContent: "center",
                width: "100%",
              }}
            >
              {/* PATH 1: Initiate */}
              <div
                className="path-card"
                style={{
                  flex: "1 1 300px",
                  maxWidth: "400px",
                  background:
                    "linear-gradient(180deg, rgba(14,165,233,0.06) 0%, rgba(15,23,42,0.6) 100%)",
                  border: "1px solid rgba(14,165,233,0.15)",
                  borderRadius: 20,
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    marginBottom: 20,
                    opacity: 0.8,
                  }}
                >
                  <NinjaInitiate width={80} height={80} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0ea5e9",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  Begin Your Training
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                  Initiate Scout
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#94a3b8",
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  Access basic intelligence scrolls. Learn the fundamentals of
                  volume and price action patterns.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  {["Basic Signals", "Daily XP", "Pattern 101"].map((t) => (
                    <span key={t} className="tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* PATH 2: Elite Ninja */}
              <div
                className="path-card featured"
                style={{
                  flex: "1 1 300px",
                  maxWidth: "400px",
                  background:
                    "linear-gradient(180deg, rgba(14,165,233,0.12) 0%, rgba(15,23,42,0.8) 100%)",
                  border: "1px solid rgba(14,165,233,0.3)",
                  borderRadius: 24,
                  padding: "40px 32px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 20px 60px rgba(14,165,233,0.1)",
                  transform: "translateY(-12px)",
                  zIndex: 2,
                }}
              >
                <div className="popular-tag">MOST ELITE</div>
                <div style={{ width: 100, height: 100, marginBottom: 20 }}>
                  <NinjaMaster width={100} height={100} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#38bdf8",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  Ready for true missions?
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
                  Elite Operative
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  Full access to the Mission Briefing room. Real-time AI
                  reasoning, Penny Breakouts, and Advanced Patterns.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 20,
                  }}
                >
                  {["Full Briefings", "Sensei Reasoning", "Priority Xp"].map(
                    (t) => (
                      <span key={t} className="tag-pill featured">
                        {t}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* PATH 3: Masters */}
              <div
                className="path-card"
                style={{
                  flex: "1 1 300px",
                  maxWidth: "400px",
                  background:
                    "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, rgba(15,23,42,0.6) 100%)",
                  border: "1px solid rgba(245,158,11,0.15)",
                  borderRadius: 20,
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    marginBottom: 20,
                    opacity: 0.8,
                  }}
                >
                  <NinjaDiamond width={80} height={80} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  Lead the Academy
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 12,
                    color: "#fbbf24",
                  }}
                >
                  Master Mentor
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#94a3b8",
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  Direct communication with the Forge. Priority signals and
                  alpha suite customization.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  {["Forge Access", "Alpha Reports"].map((t) => (
                    <span key={t} className="tag-pill gold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* ═══ SCENE 5: STRIKE / PROOF ═══ */}
        <ScrollSection>
          <div
            style={{
              textAlign: "center",
              position: "relative",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.04,
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(80px, 20vw, 300px)",
                  fontWeight: 950,
                  color: "white",
                  letterSpacing: "-0.05em",
                }}
              >
                STRIKE
              </span>
            </div>
            <div
              style={{
                width: "min(500px, 80vw)",
                height: "min(500px, 50vh)",
                position: "relative",
                zIndex: 10,
                filter: "drop-shadow(0 0 40px rgba(14,165,233,0.4))",
                animation: "float 6s ease-in-out infinite",
              }}
            >
              <NinjaHeroVictory width="100%" height="100%" />
            </div>
            <h2
              style={{
                fontSize: "clamp(24px, 4vw, 48px)",
                fontWeight: 900,
                color: "#f59e0b",
                letterSpacing: "0.05em",
                marginTop: 32,
              }}
            >
              Precise Intel. Perfect Strike.
            </h2>
          </div>
        </ScrollSection>

        {/* ═══ SCENE 6: CTA ═══ */}
        <ScrollSection
          style={{ padding: 0, display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              maxWidth: 800,
              width: "100%",
              padding: "60px 24px",
            }}
          >
            <div style={{ width: 140, height: 140, margin: "0 auto 24px" }}>
              <NinjaHeroVictory width="100%" height="100%" />
            </div>

            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 900,
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              Enter the Dojo
              <br />
              <span className="text-gradient">Claim Your Rank.</span>
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 18,
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 480,
                margin: "0 auto 40px",
              }}
            >
              Join thousands of traders using AI to gain a decisive edge. Free
              scrolls available.
            </p>

            <button
              onClick={handleGetStarted}
              className="shine-effect"
              style={{
                padding: "18px 56px",
                fontSize: 18,
                fontWeight: 800,
                borderRadius: 14,
                background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 8px 32px rgba(14,165,233,0.35)",
                transition: "all 0.3s",
              }}
            >
              Start Training <ArrowRight size={20} />
            </button>
          </div>

          <div
            style={{
              width: "100%",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "#050510",
            }}
          >
            <Footer />
          </div>
        </ScrollSection>
      </div>
    </div>
  );
}
