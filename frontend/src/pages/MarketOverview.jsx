import { useEffect, useState, useMemo } from "react";
import { marketApi } from "../api/market"; // Use the new marketApi
import client from "../api/client"; // Use the new API client for meta
import StockCard from "../components/StockCard";
// import MobileStockCard from "../components/MobileStockCard"; // Removed unused import
import FeaturePreviewCard from "../components/FeaturePreviewCard";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Clock,
  Search,
  ExternalLink,
  Zap,
  Shield,
  Target,
  Crown,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { Link } from "react-router-dom";
import NinjaTrainingLoader from "../components/NinjaTrainingLoader";
import {
  NinjaCharting,
  NinjaMeditating,
  NinjaVictory,
  NinjaChaos, // Import NinjaChaos
} from "../components/NinjaIllustrations";
import StockDetailModal from "../components/StockDetailModal";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import ProModal from "../components/ProModal";

import { usePostHog } from "posthog-js/react";

export default function MarketOverview() {
  const { user } = useAuth();
  const { addXp } = useGame();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null); // Removed unused state
  const [tickerSearch, setTickerSearch] = useState("");
  const [tickerResult, setTickerResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [meta, setMeta] = useState({});
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("viewed_market_overview");
    fetchOverview();
    fetchMeta();
  }, [posthog]);

  async function fetchMeta() {
    try {
      const res = await client.get("/api/meta");
      if (res.data?.status === "ok") {
        const metaMap = {};
        res.data.data.forEach((item) => {
          metaMap[item.key] = item.value_int;
        });
        setMeta(metaMap);
      }
    } catch {
      // ignore
    }
  }

  async function handleFeatureVote(key) {
    try {
      const res = await client.post(`/api/meta/increment/${key}`);
      if (res.data?.status === "ok") {
        setMeta((prev) => ({
          ...prev,
          [key]: res.data.newValue,
        }));
        addXp(2, `Voted for Arsenal Upgrade: ${key.replace("votes_", "")}`);
      }
    } catch (_error) {
      // Changed 'err' to '_error' to mark as unused
      console.error("Failed to increment vote:", _error);
    }
  }

  async function fetchOverview() {
    setLoading(true);
    // setError(null); // Removed unused state setter
    try {
      const data = await marketApi.getOverview();
      setData(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function loadSenseiAnalysis(ticker) {
    setAnalyzing(true);
    setTickerResult(null);
    try {
      const data = await marketApi.getSenseiAnalysis(ticker);
      setTickerResult(data);
      addXp(10, `Intelligence Gathered: ${ticker}`);
    } catch {
      setTickerResult({ error: true });
    }
    setAnalyzing(false);
  }

  async function analyzeTicker() {
    if (!tickerSearch.trim()) return;

    // Start trial if not already active or used
    if (!trialActive && trialTimeLeft > 0) {
      setTrialActive(true);
    }

    if (trialTimeLeft <= 0) {
      setShowProModal(true);
      return;
    }

    const ticker = tickerSearch.trim().toUpperCase();
    posthog?.capture("clicked_analyze_ticker", { ticker });
    await loadSenseiAnalysis(ticker);
  }

  const marketPowerLevel = useMemo(() => {
    if (!data || !data.indices) return 0;
    const upCount = data.indices.filter((idx) => idx.changePct >= 0).length;
    return Math.min(100, (upCount / data.indices.length) * 100);
  }, [data]);

  /* Trial Logic */
  const [trialTimeLeft, setTrialTimeLeft] = useState(30);
  const [trialActive, setTrialActive] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    let timer;
    if (trialActive && trialTimeLeft > 0) {
      timer = setInterval(() => {
        setTrialTimeLeft((prev) => {
          if (prev <= 1) {
            setTrialActive(false);
            setShowProModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [trialActive, trialTimeLeft]);

  if (loading) {
    return (
      <div
        className="page"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 80,
        }}
      >
        <NinjaTrainingLoader text="Scanning Global Battlefronts..." />
      </div>
    );
  }

  return (
    <div
      id="market-overview-page"
      className="page"
      style={{ paddingBottom: 80 }}
    >
      <ProModal isOpen={showProModal} />
      {/* Ambient Background */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          right: "-15%",
          opacity: 0.03,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <NinjaCharting width={600} height={600} />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            paddingTop: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: "var(--gradient-card)",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--ninja-border)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{ animation: "spin 20s linear infinite", opacity: 0.8 }}
              >
                <NinjaCharting width={60} height={60} />
              </div>
            </div>
            <div>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  marginBottom: 4,
                  letterSpacing: "-0.02em",
                }}
              >
                Mission <span className="text-gradient">Control</span>
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                Live tracking of Global Battlefronts & High Priority Targets
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!user && (
              <Link
                to="/"
                className="btn btn-secondary"
                style={{ marginRight: 8 }}
              >
                <ExternalLink size={16} /> Home Base
              </Link>
            )}
            <span
              className={`badge ${data?.marketOpen && data?.indices?.length > 0 ? "badge-green" : "badge-red"} shine-effect`}
              style={{ height: 36, padding: "0 16px", fontSize: 14 }}
            >
              {data?.marketOpen && data?.indices?.length > 0 ? (
                <Activity size={16} />
              ) : (
                <Clock size={16} />
              )}
              {data?.marketOpen && data?.indices?.length > 0
                ? "Sector Active"
                : "Sector Inactive (Last Session Intel)"}
            </span>
            <button
              className="btn btn-ghost"
              onClick={fetchOverview}
              title="Refresh Intel"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Sensei's Tactical Commentary */}
        {data?.commentary && (
          <div
            className="glass-card standout-card animate-in-up"
            style={{
              marginBottom: 32,
              padding: '24px 32px',
              background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.08) 0%, rgba(5, 5, 16, 0.4) 100%)',
              borderLeft: '4px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <NinjaMeditating width={60} height={60} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 6
              }}>
                Sensei's Tactical Intelligence
              </div>
              <p style={{
                fontSize: 16,
                lineHeight: 1.6,
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: 0,
                fontStyle: 'italic'
              }}>
                "{data.commentary}"
              </p>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
              <BrainCircuit size={120} />
            </div>
          </div>
        )}

        {/* Market Power Level & Index Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >
          {/* Power Level Card */}
          <div
            className="glass-card standout-card"
            style={{
              padding: 24,
              background:
                "linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(0,0,0,0.3))",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                opacity: 0.1,
              }}
            >
              <Zap size={120} color="var(--primary)" />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Zap size={20} color="var(--primary)" fill="var(--primary)" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Market Power Level
              </span>
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "white",
                marginBottom: 8,
                fontFamily: "var(--font-mono)",
              }}
            >
              {marketPowerLevel}%
            </div>
            <div
              style={{
                height: 8,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${marketPowerLevel}%`,
                  background:
                    marketPowerLevel > 60
                      ? "var(--emerald)"
                      : marketPowerLevel > 30
                        ? "var(--amber)"
                        : "var(--crimson)",
                  boxShadow: `0 0 10px ${marketPowerLevel > 60 ? "var(--emerald)" : marketPowerLevel > 30 ? "var(--amber)" : "var(--crimson)"}`,
                  transition: "width 1s cubic-bezier(0.19, 1, 0.22, 1)",
                }}
              />
            </div>
            <p
              style={{
                mt: 16,
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 16,
              }}
            >
              Sensei's aggregate reading of global momentum.
            </p>
          </div>

          {/* Quick Indices */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {data?.indices?.slice(0, 4).map((idx, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {idx.name}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900 }}>
                  {idx.price?.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      idx.changePct >= 0 ? "var(--emerald)" : "var(--crimson)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {idx.changePct >= 0 ? "+" : ""}
                  {idx.changePct}%
                  {idx.changePct >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker Search Analysis */}
        <div
          className="glass-card search-card"
          style={{
            marginBottom: 48,
            padding: 0,
            overflow: "hidden",
            border: "1px solid var(--ninja-border)",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid var(--ninja-border)",
              padding: " clamp(16px, 4vw, 24px)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              <Search
                size={18}
                style={{
                  verticalAlign: "middle",
                  marginRight: 8,
                  color: "var(--primary)",
                }}
              />
              Sensei's Tactical Briefing
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                type="text"
                value={tickerSearch}
                onChange={(e) => setTickerSearch(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && analyzeTicker()}
                placeholder="Enter Target Code (e.g. AAPL, NVDA)..."
                style={{
                  flex: "1 1 200px",
                  padding: "12px 16px",
                  background: "var(--ninja-surface)",
                  border: "1px solid var(--ninja-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 16,
                  outline: "none",
                  transition: "border 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--ninja-border)")
                }
              />
              <button
                className="btn btn-primary"
                onClick={analyzeTicker}
                disabled={analyzing}
                style={{ flex: "1 1 120px" }}
              >
                {analyzing ? "Cracking..." : "Commence Scan"}
              </button>
            </div>
          </div>

          {tickerResult && !tickerResult.error && (
            <div style={{ padding: 32, animation: "fadeIn 0.5s ease" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 32,
                  alignItems: "start",
                }}
              >
                {/* Left: Metrics */}
                <div style={{ flex: 1, minWidth: 250 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <h2 style={{ fontSize: 32, fontWeight: 900 }}>
                      {tickerResult.ticker}
                    </h2>
                    <span
                      style={{ fontSize: 24, fontFamily: "var(--font-mono)" }}
                    >
                      ${tickerResult.price}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color:
                          tickerResult.changePct >= 0
                            ? "var(--emerald)"
                            : "var(--crimson)",
                      }}
                    >
                      {tickerResult.changePct >= 0 ? "+" : ""}
                      {tickerResult.changePct}%
                    </span>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div
                      className={`verdict-badge ${tickerResult.verdict.replace(" ", "-").toLowerCase()}`}
                    >
                      {tickerResult.verdict === "STRONG BUY"
                        ? "STRIKE NOW"
                        : tickerResult.verdict}
                    </div>
                  </div>
                  <div className="metric-box" style={{ marginBottom: 24 }}>
                    <div className="metric-label">Sensei's Confidence</div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <NinjaMeditating width={40} height={40} />
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(tickerResult.score || 0) * 10}%`, // Assuming score is 1-10
                            background: "var(--primary)",
                            transition: "width 0.8s ease-out",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        {(tickerResult.score || 0) * 10}%
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}
                    >
                      {tickerResult.reasoning}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {tickerResult.signals?.map((sig, i) => (
                      <span
                        key={i}
                        className="badge badge-green"
                        style={{
                          fontSize: 12,
                          padding: "6px 12px",
                          borderRadius: 20,
                        }}
                      >
                        <Target size={12} /> {sig}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Chart & Mascot */}
                <div style={{ flex: 1.5, minWidth: 300, position: "relative" }}>
                  {/* Sensei's Avatar */}
                  <div
                    style={{
                      position: "absolute",
                      top: -20,
                      right: 0,
                      zIndex: 10,
                      animation: "popIn 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
                    }}
                  >
                    {tickerResult.verdict === "STRONG BUY" ? (
                      <NinjaVictory width={120} height={120} />
                    ) : tickerResult.verdict === "BUY" ? (
                      <NinjaMeditating width={100} height={100} />
                    ) : tickerResult.verdict === "SELL" ? (
                      <NinjaChaos width={100} height={100} />
                    ) : (
                      <NinjaMeditating width={100} height={100} />
                    )}
                  </div>

                  <div
                    style={{
                      height: 250,
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: 16,
                      padding: 16,
                      border: "1px solid var(--ninja-border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Activity size={14} /> HISTORICAL BATTLEFRONT
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tickerResult.priceHistory}>
                        <defs>
                          <linearGradient
                            id="chartFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={
                                tickerResult.changePct >= 0
                                  ? "var(--emerald)"
                                  : "var(--crimson)"
                              }
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor={
                                tickerResult.changePct >= 0
                                  ? "var(--emerald)"
                                  : "var(--crimson)"
                              }
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            background: "var(--ninja-surface)",
                            border: "1px solid var(--ninja-border)",
                            borderRadius: 8,
                            color: "var(--text-primary)",
                            fontSize: 13,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke={
                            tickerResult.changePct >= 0
                              ? "var(--emerald)"
                              : "var(--crimson)"
                          }
                          fill="url(#chartFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ textAlign: "right", marginTop: 8 }}>
                    <a
                      href={`https://finance.yahoo.com/quote/${tickerResult.ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      View Extended Scroll <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tickerResult?.error && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ color: "var(--crimson-glow)", fontSize: 16 }}>
                🚫 Hostile target "{tickerSearch}" not found. Verify
                transmission.
              </p>
            </div>
          )}
        </div>

        {/* Top Movers */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--ninja-border)",
              background: "rgba(255,255,255,0.01)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
              <Shield
                size={18}
                style={{
                  verticalAlign: "middle",
                  marginRight: 8,
                  color: "var(--primary)",
                }}
              />
              High Priority Targets {data?.marketOpen ? "(Current Combatants)" : "(Last Session)"}
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            {(!data?.topMovers || data.topMovers.length === 0) ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Shield size={48} style={{ opacity: 0.2 }} />
                <p>No high priority targets detected in current sector scan.</p>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  0 results found regarding active combatants.
                </span>
              </div>
            ) : (
              data.topMovers.map((stock, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    paddingLeft: i < 3 ? 40 : 12,
                    marginBottom: 12,
                  }}
                >
                  {i < 3 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        background:
                          i === 0
                            ? "var(--amber)"
                            : i === 1
                              ? "var(--text-muted)"
                              : "var(--ninja-border)",
                        color: i === 0 ? "black" : "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 900,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {i === 0 ? <Crown size={16} /> : i + 1}
                    </div>
                  )}
                  <StockCard
                    stock={stock}
                    compact
                    onClick={() => setSelectedTicker(stock.ticker)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coming Soon Banners */}
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              paddingLeft: 8,
            }}
          >
            <div
              style={{
                width: 4,
                height: 24,
                background: "var(--primary)",
                borderRadius: 2,
              }}
            />
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Future <span className="text-gradient">Arsenal</span>
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            <FeaturePreviewCard
              title="Paper Trading Dojo"
              description="Practice with $100k virtual cash. Test your strategies risk-free before entering the real market."
              icon={Target}
              link="/paper-trading"
              color="var(--amber)"
            />
            <FeaturePreviewCard
              title="Strategy Backtest Chamber"
              description="Run your custom indicators against 10 years of historical scrolls. Validate before you trade."
              icon={Activity}
              color="var(--primary)"
              votes={meta["votes_strategy_backtesting"] || 892}
              onVote={() => handleFeatureVote("votes_strategy_backtesting")}
            />
          </div>
        </div>
      </div>
      {selectedTicker && (
        <StockDetailModal
          ticker={selectedTicker}
          onClose={() => setSelectedTicker(null)}
        />
      )}

      <style>{`
                #market-overview-page .metric-box { background: rgba(0,0,0,0.2); padding: 12px; borderRadius: 8px; border: 1px solid var(--ninja-border); }
                #market-overview-page .metric-box .metric-label { font-size: 10px; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
                #market-overview-page .metric-box .metric-value { font-size: 18px; font-weight: 900; font-family: var(--font-mono); }
                
                #market-overview-page .verdict-badge { 
                    display: inline-block; padding: 12px 24px; border-radius: 8px; 
                    font-size: 18px; font-weight: 900; letter-spacing: 1px;
                }
                #market-overview-page .verdict-badge.strong-buy, #market-overview-page .verdict-badge.strike-now { 
                    background: rgba(16, 185, 129, 0.2); color: var(--emerald-glow); border: 1px solid var(--emerald); 
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
                }
                #market-overview-page .verdict-badge.watchlist { background: rgba(245, 158, 11, 0.1); color: var(--amber); border: 1px solid var(--amber); }
                
                @keyframes popIn {
                    from { transform: scale(0) rotate(-10deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                @media (max-width: 768px) {
                    #market-overview-page .container { padding: 0 20px !important; }
                    #market-overview-page h1 { font-size: 28px !important; }
                    #market-overview-page .glass-card { padding: 16px !important; }
                    #market-overview-page .search-card { padding: 0 !important; }
                    
                    #market-overview-page div[style*="opacity: 0.03"] { display: none !important; }

                    #market-overview-page div[style*="justify-content: space-between"] {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 16px !important;
                    }
                    
                    #market-overview-page div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr 1fr !important; 
                        gap: 12px !important;
                    }

                    #market-overview-page div[style*="display: flex"][style*="align-items: start"] {
                        flex-direction: column !important;
                    }
                    #market-overview-page div[style*="min-width: 300"] {
                        width: 100% !important;
                        min-width: auto !important;
                        margin-top: 24px !important;
                    }

                    #market-overview-page div[style*="animation: popIn"] {
                        display: none !important; 
                    }
                }
            `}</style>
    </div>
  );
}
