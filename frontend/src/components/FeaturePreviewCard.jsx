import { useState } from "react";
import { Vote, Bell, Check } from "lucide-react";
import { usePostHog } from "posthog-js/react";

export default function FeaturePreviewCard({
  title,
  description,
  icon: Icon,
  color = "var(--primary)",
  votes,
  onVote,
}) {
  const [voted, setVoted] = useState(false);
  const posthog = usePostHog();

  const handleVote = (e) => {
    e.stopPropagation();
    if (voted || !onVote) return;
    setVoted(true);
    onVote();
    posthog?.capture("voted_feature", { feature: title });
  };

  return (
    <div
      style={{
        background: "var(--ninja-surface)",
        border: `1px solid ${voted ? color : "var(--ninja-border)"}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            minWidth: 48,
            height: 48,
            borderRadius: 12,
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
          }}
        >
          <Icon size={24} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                padding: "4px 8px",
                borderRadius: 4,
                background: `${color}20`,
                color: color,
                letterSpacing: "0.05em",
              }}
            >
              Coming Soon
            </span>
          </div>

          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            {description}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Vote size={14} /> {votes} Traders interested
            </div>

            <button
              onClick={handleVote}
              className={voted ? "" : "shine-effect"}
              style={{
                padding: "8px 16px",
                borderRadius: 100,
                border: "none",
                background: voted ? "var(--ninja-border)" : color,
                color: voted ? "var(--text-muted)" : "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: voted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              {voted ? (
                <>
                  <Check size={14} /> Voted
                </>
              ) : (
                <>
                  <Bell size={14} /> Notify Me
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Background Blob */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: color,
          borderRadius: "50%",
          opacity: 0.05,
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
    </div>
  );
}
