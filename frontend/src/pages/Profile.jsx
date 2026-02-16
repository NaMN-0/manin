import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import {
  Save,
  LogOut,
  Edit3,
  Crown,
  Check,
  X,
  Trophy,
  Coins,
  Zap,
} from "lucide-react";
import client from "../api/client"; // Use the new API client
import SmartLoader from "../components/SmartLoader";
import {
  ALL_AVATARS,
  getAvatarById,
  getRandomAvatarId,
} from "../components/NinjaAvatars";

const COMBAT_STYLES = [
  {
    id: "genin",
    label: "Shadow Walker",
    desc: "The path of stealth. You prefer low-risk entries and silent accumulation.",
    color: "#0ea5e9", // Sky blue
    icon: "🌑",
  },
  {
    id: "jonin",
    label: "Iron Fist",
    desc: "The path of discipline. You strike with conviction on high-probability setups.",
    color: "#8b5cf6", // Violet
    icon: "👊",
  },
  {
    id: "kage",
    label: "Wind Dancer",
    desc: "The path of momentum. You ride the volatility waves with speed and precision.",
    color: "#f59e0b", // Amber
    icon: "🌪️",
  },
];

export default function Profile() {
  const { user, isPro, signOut } = useAuth();
  const { xp, level, rank, virtualCash } = useGame();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || "",
    combat_style: "genin",
    avatarId: localStorage.getItem("ninja_avatar_id") || getRandomAvatarId(),
  });

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    setLoading(true);
    try {
      // Updated to use the new client.post and client.get
      const [, profileRes] = await Promise.all([
        client.post("/api/auth/on-login"),
        client.get("/api/auth/profile"),
      ]);
      const profileData = profileRes.data.data;
      if (profileData) {
        setProfile((p) => ({
          ...p,
          combat_style: profileData.combat_style || "genin",
        }));
      }
      if (user?.user_metadata?.full_name && !profile.name) {
        setProfile((p) => ({ ...p, name: user.user_metadata.full_name }));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    localStorage.setItem("ninja_avatar_id", profile.avatarId);
    window.dispatchEvent(new Event("avatar-changed"));
    try {
      // Updated to use client.patch
      await client.patch("/api/auth/profile", {
        combat_style: profile.combat_style,
      });
    } catch (e) {
      console.error("Failed to save profile", e);
    }
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading)
    return (
      <div
        className="page"
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SmartLoader />
      </div>
    );

  const CurrentAvatarComp = getAvatarById(profile.avatarId).Component;

  return (
    <div
      className="page"
      style={{ paddingBottom: 80, background: "#050510", minHeight: "100vh" }}
    >
      <div
        className="container"
        style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}
      >
        {/* Page title */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            paddingTop: 32,
            marginBottom: 32,
            letterSpacing: "-0.02em",
          }}
        >
          Your <span className="text-gradient">Profile</span>
        </h1>

        {/* Avatar + Name card */}
        <div
          className="glass-card"
          style={{
            padding: 32,
            marginBottom: 24,
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Avatar */}
          <div
            onClick={() => setIsEditingAvatar(true)}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              margin: "0 auto 20px",
              border: "3px solid var(--ninja-surface)",
              padding: 4,
              background: "var(--ninja-black)",
              cursor: "pointer",
              position: "relative",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--ninja-surface)")
            }
          >
            <CurrentAvatarComp />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: "var(--primary)",
                borderRadius: "50%",
                padding: 6,
                border: "3px solid var(--ninja-black)",
              }}
            >
              <Edit3 size={12} color="white" />
            </div>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your name"
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "2px solid var(--ninja-border)",
              textAlign: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "white",
              width: "100%",
              maxWidth: 300,
              padding: "8px 0",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) =>
              (e.target.style.borderBottomColor = "var(--primary)")
            }
            onBlur={(e) =>
              (e.target.style.borderBottomColor = "var(--ninja-border)")
            }
          />

          {/* Email */}
          <div
            style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}
          >
            {user?.email}
          </div>

          {/* Pro badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
              padding: "6px 14px",
              borderRadius: 20,
              background: isPro
                ? "rgba(245, 158, 11, 0.1)"
                : "rgba(148, 163, 184, 0.08)",
              color: isPro ? "#f59e0b" : "var(--text-muted)",
              border: `1px solid ${isPro ? "rgba(245,158,11,0.3)" : "var(--ninja-border)"}`,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {isPro ? (
              <>
                <Crown size={14} fill="currentColor" /> PRO
              </>
            ) : (
              "FREE PLAN"
            )}
          </div>
        </div>

        {/* Avatar picker overlay */}
        {isEditingAvatar && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                Choose Avatar
              </span>
              <button
                onClick={() => setIsEditingAvatar(false)}
                className="btn btn-ghost"
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                gap: 10,
              }}
            >
              {ALL_AVATARS.map((av) => (
                <div
                  key={av.id}
                  onClick={() => {
                    setProfile({ ...profile, avatarId: av.id });
                    setIsEditingAvatar(false);
                  }}
                  style={{
                    cursor: "pointer",
                    borderRadius: 12,
                    padding: 10,
                    border:
                      profile.avatarId === av.id
                        ? "2px solid var(--primary)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      profile.avatarId === av.id
                        ? "rgba(14, 165, 233, 0.15)"
                        : "rgba(255,255,255,0.02)",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <av.Component />
                  <div
                    style={{
                      fontSize: 9,
                      marginTop: 4,
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {av.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ninja Journey & Stats */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Trophy size={18} className="text-gradient" /> Ninja Journey
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--primary)",
                background: "rgba(14, 165, 233, 0.1)",
                padding: "4px 10px",
                borderRadius: 12,
              }}
            >
              {rank}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Level Stat */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Level
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                }}
              >
                {level}
              </div>
            </div>

            {/* Cash Stat */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.05)",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
                border: "1px solid rgba(16, 185, 129, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#10b981",
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <Coins size={12} /> Cash
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#10b981",
                  lineHeight: 1,
                  fontFamily: "var(--font-mono)",
                }}
              >
                ${virtualCash?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 8,
                color: "var(--text-secondary)",
              }}
            >
              <span>XP Progress</span>
              <span>
                {xp % 100} / 100 <span style={{ opacity: 0.5 }}>XP</span>
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--ninja-black)",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  width: `${xp % 100}%`,
                  height: "100%",
                  background: "var(--primary)",
                  borderRadius: 4,
                  transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 10px rgba(14, 165, 233, 0.5)",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {100 - (xp % 100)} XP needed for next level
            </div>
          </div>

          {/* How it Works / Badges teaser */}
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 12,
              padding: 16,
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Zap size={14} color="#f59e0b" /> How to Earn
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Daily Login", val: "+50 XP" },
                { label: "Predicting Moonshots", val: "+100 XP" },
                { label: "Winning Paper Trade", val: "+$1,000" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: "white", fontWeight: 600 }}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combat Style */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div
            className="text-gradient"
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Zap size={20} fill="currentColor" /> Choose Your Ninja Way
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {COMBAT_STYLES.map((style) => {
              const selected = profile.combat_style === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() =>
                    setProfile({ ...profile, combat_style: style.id })
                  }
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `1.5px solid ${selected ? style.color : "rgba(255,255,255,0.06)"}`,
                    background: selected
                      ? `${style.color}10`
                      : "rgba(255,255,255,0.02)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: selected ? "white" : "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{style.icon}</span> {style.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {style.desc}
                    </div>
                  </div>
                  {selected && (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: style.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={12} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            padding: "14px",
            marginBottom: 16,
            background: saved ? "var(--emerald)" : undefined,
          }}
        >
          {saving ? (
            "Saving..."
          ) : saved ? (
            <>
              <Check size={18} /> Saved!
            </>
          ) : (
            <>
              <Save size={18} /> Save Changes
            </>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="btn btn-ghost"
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: 14,
            color: "var(--text-muted)",
            padding: "12px",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
