import { useEffect, useState, useMemo, memo } from "react";
// import { Link } from "react-router-dom"; // Link is not used
import {
  X,
  ExternalLink,
  Activity,
  BarChart3,
  Shield,
  Target,
  Sword,
  Scroll,
  Flame,
  Award,
  Rocket,
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { marketApi } from "../api/market"; // Use the new marketApi
import NinjaLoader from "./NinjaLoader";
import { useGame } from "../context/GameContext";

const StockChart = memo(({ data }) => (
  <div
    style={{
      height: 180,
      marginBottom: 24,
      background: "rgba(0,0,0,0.3)",
      borderRadius: 16,
      padding: "20px 10px 10px",
      border: "1px solid rgba(255,255,255,0.05)",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 20,
        fontSize: 10,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      Historical Trajectory
    </div>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            background: "rgba(10, 10, 15, 0.9)",
            border: "1px solid rgba(14, 165, 233, 0.3)",
            borderRadius: 12,
            backdropFilter: "blur(8px)",
            padding: "8px 12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            color: "white",
          }}
          itemStyle={{ color: "#0ea5e9", fontWeight: 700 }}
          labelStyle={{ display: "none" }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#0ea5e9"
          fill="url(#chartFill)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: "#0ea5e9", stroke: "white", strokeWidth: 2 }}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
));
StockChart.displayName = "StockChart"; // Add display name

function MissionMetric({
  label,
  value,
  icon: Icon,
  color,
  glow = false,
  blur = false,
}) {
  const displayValue =
    !value || String(value).includes("NaN") || String(value).includes("null")
      ? "N/A"
      : value;

  const content = (
    <div
      className="glass-card"
      style={{
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: glow ? `0 0 15px ${color}33` : "none",
        border: glow ? `1px solid ${color}44` : "1px solid var(--ninja-border)",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && <Icon size={16} color={color || "var(--text-muted)"} />}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: color || "white" }}>
        {displayValue}
      </div>
    </div>
  );

  return content;
}

function DataRow({ label, value, color }) {
  const displayValue =
    !value || String(value).includes("NaN") || String(value).includes("null")
      ? "0.00"
      : value;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || "white" }}>
        {displayValue}
      </span>
    </div>
  );
}

function StockDetailModal({ ticker, initialData, onClose }) {
  const { addXp, addCash } = useGame();
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  // const [error, setError] = useState(null); // Removed unused state
  const [xpAwarded, setXpAwarded] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [striking, setStriking] = useState(false);
  const [hasStruck, setHasStruck] = useState(false);

  useEffect(() => {
    if (!ticker) return;

    if (initialData && initialData.ticker === ticker) {
      setData(initialData);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    async function fetchData() {
      try {
        const data = await marketApi.getSenseiAnalysis(ticker);
        if (mounted) setData(data);
      } catch {
        // ignore
      }
      if (mounted) setLoading(false);
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [ticker, initialData]);

  useEffect(() => {
    if (!data?.reasoning) return;
    setTypingText("");
    setTypingIndex(0);

    let i = 0;
    const fullText = data.reasoning;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypingText((prev) => prev + fullText.charAt(i));
        setTypingIndex(i + 1);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 15);
    return () => clearInterval(timer);
  }, [data?.reasoning]);

  useEffect(() => {
    if (data && !xpAwarded) {
      const timer = setTimeout(() => {
        addXp(10, `Mission Intel Gathered: ${ticker}`);
        setXpAwarded(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data, ticker, addXp, xpAwarded]);

  const handleStrike = () => {
    if (hasStruck) return;
    setStriking(true);
    setTimeout(() => {
      setStriking(false);
      setHasStruck(true);
      addXp(50, `Simulated Strike Success: ${ticker}`);
      addCash(500, `Simulated Strike Reward: ${ticker}`);
    }, 1500);
  };

  if (!ticker) return null;

  // eslint-disable-next-line no-unused-vars
  const chartData = useMemo(
    () => data?.priceHistory || [],
    [data?.priceHistory],
  );
  const isUp = (data?.changePct ?? 0) >= 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(2, 2, 5, 0.85)",
        backdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        className="mission-scroll"
        style={{
          maxWidth: 800,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0a0a0f",
          border: "2px solid var(--ninja-border)",
          borderRadius: 24,
          position: "relative",
          boxShadow: "0 0 80px rgba(14,165,233,0.15)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: 4,
            width: "100%",
            background: "var(--gradient-primary)",
            borderRadius: "24px 24px 0 0",
          }}
        />

        <div
          style={{
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 50,
                height: 50,
                background: "var(--ninja-surface)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--ninja-border)",
              }}
            >
              <Scroll color="var(--primary)" size={28} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                    margin: 0,
                  }}
                >
                  {ticker}
                </h2>
                <span
                  className={`badge ${isUp ? "badge-emerald" : "badge-crimson"}`}
                  style={{ fontSize: 12 }}
                >
                  {isUp ? "+" : ""}
                  {data?.changePct || 0}% Strike
                </span>
              </div>
              <p
                style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}
              >
                {data?.companyName || "Classified Asset"} •{" "}
                {data?.sector || "Unknown Sector"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-close-hex"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <X size={28} />
          </button>
        </div>

        {loading ? (
          <div
            style={{ padding: 100, display: "flex", justifyContent: "center" }}
          >
            <NinjaLoader variant="meditating" />
          </div>
        ) : (
          <div style={{ padding: 32 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              <MissionMetric
                icon={Sword}
                label="Current Strike Price"
                value={`$${data.price}`}
                color="white"
              />
              <MissionMetric
                blur
                icon={Target}
                label="AI Predicted Kill"
                value={`$${data.predicted || "N/A"}`}
                color="var(--primary)"
                glow
              />
              <MissionMetric
                icon={Award}
                label="Sensei Trust Rating"
                value={`${data.score || "N/A"}/10`}
                color="var(--sky)"
              />
              <MissionMetric
                icon={Flame}
                label="Engagement Vol"
                value={`${(data.volume / 1000).toFixed(1)}k`}
                color="var(--amber)"
              />
            </div>

            <div
              style={{
                background: "rgba(14,165,233,0.03)",
                borderRadius: 24,
                border: "1px solid rgba(14,165,233,0.15)",
                padding: 32,
                marginBottom: 32,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 4,
                  height: "100%",
                  background: "var(--primary)",
                  boxShadow: "0 0 15px var(--primary)",
                }}
              />

              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "var(--primary)",
                  marginBottom: 20,
                }}
              >
                <Shield size={16} /> Sensei's Tactical Briefing
              </h3>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.05)",
                  position: "relative",
                  minHeight: 100,
                }}
              >
                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: "#f1f5f9",
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {typingText}
                  <span
                    style={{
                      opacity:
                        typingIndex < (data.reasoning || "").length ? 1 : 0,
                      color: "var(--primary)",
                    }}
                  >
                    _
                  </span>
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
                marginBottom: 32,
              }}
            >
              <div
                className="intel-card"
                style={{
                  background: "var(--ninja-surface)",
                  padding: 20,
                  borderRadius: 16,
                  border: "1px solid var(--ninja-border)",
                }}
              >
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <BarChart3 size={16} color="var(--sky)" /> Asset Attributes
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <DataRow
                    label="Market Size"
                    value={`$${(data.marketCap / 1e6).toFixed(1)}M`}
                  />
                  <DataRow
                    label="Forge Ratio (PE)"
                    value={data.pe > 0 ? data.pe.toFixed(1) : "\u2014"}
                  />
                  <DataRow label="High Mark" value={`$${data.yearHigh}`} />
                  <DataRow label="Low Mark" value={`$${data.yearLow}`} />
                </div>
              </div>

              <div
                className="intel-card"
                style={{
                  background: "var(--ninja-surface)",
                  padding: 20,
                  borderRadius: 16,
                  border: "1px solid var(--ninja-border)",
                }}
              >
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Activity size={16} color="var(--primary)" /> Strike Patterns
                </h4>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {data.signals?.length > 0 ? (
                    data.signals.map((sig, i) => {
                      const isVelocity =
                        sig.includes("Vertical") ||
                        sig.includes("Velocity") ||
                        sig.includes("Acceleration");
                      return (
                        <div
                          key={i}
                          style={{
                            fontSize: 13,
                            padding: "8px 12px",
                            background: isVelocity
                              ? "rgba(239, 68, 68, 0.05)"
                              : "rgba(255,255,255,0.03)",
                            borderRadius: 8,
                            borderLeft: isVelocity
                              ? "3px solid var(--red-glow)"
                              : "3px solid var(--primary)",
                            color: isVelocity
                              ? "var(--red-glow)"
                              : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {isVelocity && <Rocket size={12} />}
                          {sig}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      No major patterns detected in this scroll.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: 24,
              }}
            >
              <button
                className={`btn ${hasStruck ? "btn-secondary" : "btn-primary"}`}
                style={{
                  flex: 2,
                  height: 56,
                  fontSize: 16,
                  fontWeight: 800,
                  position: "relative",
                  overflow: "hidden",
                }}
                onClick={() => {
                  handleStrike();
                  // Add to Watchlist (Frontend Only)
                  const watchlist = JSON.parse(localStorage.getItem("ninjaWatchlist") || "[]");
                  if (!watchlist.some(item => item.ticker === ticker)) {
                    watchlist.push({
                      ticker,
                      price: data.price,
                      changePct: data.changePct,
                      score: data.score,
                      addedAt: Date.now()
                    });
                    localStorage.setItem("ninjaWatchlist", JSON.stringify(watchlist));
                    // Dispatch event for PennyStocks to pick up
                    window.dispatchEvent(new Event("watchlistUpdated"));
                  }
                }}
                disabled={striking || hasStruck}
              >
                {striking ? (
                  <NinjaLoader variant="fighting" />
                ) : hasStruck ? (
                  <>
                    <Award size={20} style={{ marginRight: 8 }} /> TARGET LOCKED (+50XP)
                  </>
                ) : (
                  <>
                    <Target size={20} style={{ marginRight: 8 }} /> RADAR LOCK
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "var(--amber)",
                        color: "black",
                        fontSize: 10,
                        padding: "2px 8px",
                        fontWeight: 900,
                      }}
                    >
                      +50XP
                    </span>
                  </>
                )}
              </button>
              <a
                href={`https://www.tradingview.com/symbols/${ticker}/`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{
                  width: 56,
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
                .mission-scroll::-webkit-scrollbar { width: 6px; }
                .mission-scroll::-webkit-scrollbar-thumb { background: var(--ninja-border); borderRadius: 10px; }
            `}</style>
    </div>
  );
}
export default memo(StockDetailModal);
