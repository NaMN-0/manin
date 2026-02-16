import { Info, Newspaper } from "lucide-react";

export default function NewsIntelligence({ data, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", opacity: 0.5 }}>
        <div className="pulse-dot" style={{ margin: "0 auto 20px" }}></div>
        <div style={{ fontFamily: "monospace", letterSpacing: 2 }}>
          DECRYPTING SENTIMENT CHANNELS...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "100px 20px",
          color: "var(--text-muted)",
        }}
      >
        No significant sentiment shifts detected in recent news cycles.
      </div>
    );
  }

  return (
    <div className="news-intelligence animate-enter">
      <div style={{ marginBottom: 30 }}>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Newspaper className="text-primary" /> Top 10 Sentiment Alpha
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          AI-driven news analysis ranking stocks by sentiment strength and 4-day
          outlook.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {data.map((item, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              padding: 24,
              borderLeft: `4px solid ${item.sentiment === "Bullish" ? "var(--emerald)" : item.sentiment === "Bearish" ? "var(--crimson)" : "var(--text-muted)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    fontFamily: "monospace",
                    letterSpacing: -1,
                  }}
                >
                  {item.ticker}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      item.sentiment === "Bullish"
                        ? "var(--emerald)"
                        : item.sentiment === "Bearish"
                          ? "var(--crimson)"
                          : "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {item.sentiment} Signal
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  ${item.price}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color:
                      item.changePct >= 0 ? "var(--emerald)" : "var(--crimson)",
                  }}
                >
                  {item.changePct >= 0 ? "+" : ""}
                  {item.changePct}%
                </div>
              </div>
            </div>

            {/* Sentiment Bar */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  marginBottom: 6,
                  opacity: 0.7,
                }}
              >
                <span>SENTIMENT ALPHA</span>
                <span>
                  {item.sentimentScore > 0 ? "+" : ""}
                  {item.sentimentScore}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(Math.abs(item.sentimentScore) * 15 + 20, 100)}%`,
                    background:
                      item.sentiment === "Bullish"
                        ? "var(--emerald)"
                        : item.sentiment === "Bearish"
                          ? "var(--crimson)"
                          : "gray",
                    borderRadius: 3,
                    boxShadow: `0 0 10px ${item.sentiment === "Bullish" ? "rgba(16,185,129,0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  }}
                />
              </div>
            </div>

            {/* Headline */}
            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                Latest Headline
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
                {item.headline}
              </div>
            </div>

            {/* Outlook */}
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 0",
              }}
            >
              <Info
                size={16}
                className="text-sky flex-shrink-0"
                style={{ marginTop: 2 }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                }}
              >
                {item.outlook}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
