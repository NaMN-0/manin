import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MousePointer2, Zap, Shield, TrendingUp, Github } from "lucide-react";
import KageLogo from "../components/KageLogo";
import {
  NinjaSceneVoid,
  NinjaHeroIdle,
  NinjaHeroScanning,
  NinjaHeroDash,
  NinjaHeroShield,
  NinjaHeroVictory,
  NinjaHeroGlitch,
} from "../components/NinjaIllustrations";

// 🌧️ MATRIX RAIN (KAGE AI VERSION)
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
    const chars = "10₿Ξ$₮$█▓▒░";
    
    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.fillStyle = `rgba(5, 5, 8, ${0.1 * intensity})`;
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
      style={{ position: "absolute", inset: 0, opacity: 0.1 * intensity, pointerEvents: "none" }}
    />
  );
};

// 🥷 KAGE COMPANION
const KageCompanion = ({ state, message }) => {
  const [visibleMessage, setVisibleMessage] = useState("");
  useEffect(() => {
    if (!message) {
      setVisibleMessage("");
      return;
    }
    let idx = 0;
    let accumulated = ""; 
    setVisibleMessage("");
    const timer = setInterval(() => {
      if (idx < message.length) {
        accumulated += message.charAt(idx);
        setVisibleMessage(accumulated);
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
    <div className="kage-companion" style={{
      position: "fixed",
      bottom: 40,
      right: 40,
      zIndex: 60,
      pointerEvents: "none",
    }}>
      {visibleMessage && (
        <div className="glass" style={{
          position: "absolute",
          bottom: "100%",
          right: 0,
          marginBottom: 16,
          borderRadius: 16,
          padding: "16px 20px",
          width: 280,
          boxShadow: "0 0 30px rgba(14,165,233,0.1)",
          pointerEvents: "auto",
        }}>
          <p style={{ color: "var(--primary)", fontSize: 10, fontWeight: 900, marginBottom: 4, letterSpacing: "1px" }}>KAGE SENSEI</p>
          <p style={{ color: "white", fontSize: 14, lineHeight: 1.5 }}>{visibleMessage}</p>
        </div>
      )}
      <div style={{ width: 100, height: 100, filter: "drop-shadow(0 0 15px rgba(14,165,233,0.3))" }}>
        <Component width="100%" height="100%" />
      </div>
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const messages = useMemo(() => [
    "I am KAGE AI. The shadow that watches the crypto blocks.",
    "The markets are loud. I find the silence where alpha hides.",
    "Ready to strike? Infiltrate the command center now."
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(s => (s + 1) % messages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="landing-wrapper" style={{
      background: "#050508",
      height: "100vh",
      width: "100%",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <DigitalRain intensity={1} />
      
      {/* Glow Backdrop */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "60vw",
        height: "60vh",
        background: "radial-gradient(circle, rgba(14,165,233,12) 0%, transparent 70%)",
        opacity: 0.1,
        pointerEvents: "none"
      }} />

      {/* Navbar */}
      <nav style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "32px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <KageLogo width={32} height={32} />
          <span style={{ fontSize: 28, fontWeight: 950, letterSpacing: "-1.5px", color: "white" }}>
            KAGE <span style={{ color: "var(--primary)" }}>AI</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        </div>
      </nav>

      <KageCompanion state={currentStep === 1 ? "scanning" : "idle"} message={messages[currentStep]} />

      {/* Main Content */}
      <main style={{ textAlign: "center", maxWidth: 1000, padding: "0 24px", zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div style={{ width: 180, height: 180, margin: "0 auto 48px", animation: "float 6s ease-in-out infinite" }}>
            <NinjaSceneVoid width="100%" height="100%" />
          </div>
          
          <h1 style={{ 
            fontSize: "clamp(64px, 10vw, 120px)", 
            lineHeight: 0.9, 
            marginBottom: 24, 
            fontWeight: 950,
            letterSpacing: "-4px",
            background: "linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.4))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            SILENT INTEL.<br />LETHAL EDGE.
          </h1>
          
          <p style={{ color: "var(--text-secondary)", fontSize: 22, maxWidth: 640, margin: "0 auto 56px", lineHeight: 1.5, fontWeight: 500 }}>
            The premier crypto intelligence hub. We analyze the noise of thousands of contracts to bring you high-density volatility signals.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary shine-effect"
              style={{ padding: "22px 64px", fontSize: 20, borderRadius: 16, fontWeight: 900, letterSpacing: "-0.5px" }}
            >
              Infiltrate Dashboard
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Stats Mock */}
      <footer style={{ 
        position: "absolute", 
        bottom: 32, 
        width: "100%", 
        display: "flex", 
        justifyContent: "center", 
        gap: 64,
        zIndex: 5
      }}>
        {[
          { label: "ASSETS MONITORED", val: "12,450+" },
          { label: "NODES ONLINE", val: "64/64" },
          { label: "SYSTEM LATENCY", val: "1.2MS" }
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 900, marginBottom: 4, letterSpacing: "1px" }}>{s.label}</div>
            <div style={{ color: "white", fontSize: 16, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.val}</div>
          </div>
        ))}
      </footer>

      {/* Decorative center light */}
      <div style={{
        position: "fixed",
        bottom: "-10vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "80vw",
        height: "20vh",
        background: "radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none"
      }} />
    </div>
  );
}
