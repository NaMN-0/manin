import { useState, useEffect } from "react";
import client from "../api/client";
// import { marketApi } from "../api/market"; // Removed unused import
import { useAuth } from "../context/AuthContext";
// import { useGame } from "../context/GameContext"; // Removed unused import
import {
  Zap,
  Shield,
  Target,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Crown,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
// import NinjaLoader from "../components/NinjaLoader"; // Removed unused import
import {
  NinjaAI,
  NinjaHeadOne,
  NinjaSlicing,
  NinjaTarget,
  NinjaRocket,
  NinjaSuccess,
  RandomNinja,
  NinjaMeditating,
  // NinjaChaos, // Removed unused import
  NinjaLogic,
} from "../components/NinjaIllustrations";
import StockDetailModal from "../components/StockDetailModal";
import SmartLoader from "../components/SmartLoader";
import { usePostHog } from "posthog-js/react";

export default function ProDashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanLimit, setScanLimit] = useState(50);
  const [selectedStock, setSelectedStock] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("scan"); // 'scan', 'intelligence', or 'moonshot'
  // const [newsResults, setNewsResults] = useState([]); // Removed unused state
  // const [newsLoading, setNewsLoading] = useState(false); // Removed unused state
  const [moonshotResults, setMoonshotResults] = useState([]);
  // const [moonshotLoading, setMoonshotLoading] = useState(false); // Removed unused state
  const [trialExpired, setTrialExpired] = useState(false);

  const { checkProStatus } = useAuth();
  const posthog = usePostHog();

  const [selectedTickers, setSelectedTickers] = useState(new Set());
  // const [showNewsModal, setShowNewsModal] = useState(false); // Removed unused state

  // Toggle selection
  // const toggleTicker = (ticker) => { // 'toggleTicker' is assigned a value but never used
  //   const newSet = new Set(selectedTickers);
  //   if (newSet.has(ticker)) {
  //     newSet.delete(ticker);
  //   } else {
  //     if (newSet.size >= 20) return; // Limit to 20
  //     newSet.add(ticker);
  //   }
  //   setSelectedTickers(newSet);
  // };

  // Initial "Work Already Done" simulation
  useEffect(() => {
    posthog?.capture("viewed_pro_dashboard");
    const initialLogs = [
      "System initialized...",
      "Connected to NYSE data stream...",
      "Quantum sentiment analysis: ONLINE",
      "Waiting for command sequence...",
    ];
    setLogs(initialLogs);
  }, [posthog]);

  async function runScan() {
    if (loading) return;
    setLoading(true);
    setShowResults(true);
    setResults([]);
    setLogs((prev) => [...prev, ">> COMMAND RECEIVED: INITIATE SCAN SEQUENCE"]);

    const BATCH_SIZE = 10;
    let offset = 0;
    let totalFetched = 0;
    let consecutiveEmptyBatches = 0;

    try {
      while (totalFetched < scanLimit && consecutiveEmptyBatches < 3) {
        setLogs((prev) => [
          ...prev.slice(-4),
          `>> Scanning sector block ${offset}...`,
        ]);

        const res = await client.get(
          `/api/penny/scan_batch?limit=${BATCH_SIZE}&offset=${offset}`,
        );
        const newData = res.data.data || [];

        if (newData.length > 0) {
          setResults((prev) => {
            const combined = [...prev, ...newData];
            return combined.sort(
              (a, b) =>
                (b.isProfitable ? 1 : 0) - (a.isProfitable ? 1 : 0) ||
                b.upside - a.upside,
            );
          });
          totalFetched += newData.length;
          consecutiveEmptyBatches = 0;
        } else {
          consecutiveEmptyBatches++;
        }
        offset += BATCH_SIZE;
        await new Promise((r) => setTimeout(r, 200));
      }
      setLogs((prev) => [
        ...prev,
        `>> SCAN COMPLETE. ${totalFetched} TARGETS ACQUIRED.`,
      ]);
      if (totalFetched > 0) {
        toast.success("Scan Complete: +10 XP", {
          description: "Skill aptitude increased.",
        });
        checkProStatus?.();
      }
    } catch (error) {
      console.error(error);
      setLogs((prev) => [...prev, ">> ERROR: DATA STREAM INTERRUPTED"]);
      if (error.response?.status === 403) setTrialExpired(true);
    } finally {
      setLoading(false);
      checkProStatus?.();
    }
  }

  async function runBatchAnalysis(overrideTickers = null) {
    const tickersToScan = overrideTickers || Array.from(selectedTickers);
    if (tickersToScan.length === 0) return;

    // setNewsLoading(true); // Removed unused state
    // setShowNewsModal(true); // Removed unused state
    try {
      const res = await client.post("/api/news/batch", {
        tickers: tickersToScan,
      });
      if (res.data?.status === "ok") {
        // setNewsResults(res.data.data); // Removed unused state
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        setTrialExpired(true);
        // setShowNewsModal(false); // Removed unused state
      }
    } finally {
      // setNewsLoading(false); // Removed unused state
      checkProStatus?.();
    }
  }

  async function runMoonshotScan() {
    // if (false) return; // moonshotLoading was removed
    // setMoonshotLoading(true); // Removed unused state
    setActiveTab("moonshot");
    setLogs((prev) => [
      ...prev,
      ">> INITIATING MOONSHOT DEEP SCAN [10X ALPHA PROTOCOL]",
    ]);
    try {
      const res = await client.get("/api/penny/moonshots");
      if (res.data?.status === "ok") {
        setMoonshotResults(res.data.data);
        setLogs((prev) => [
          ...prev,
          ">> 5 TARGETS IDENTIFIED WITH EXPLOSIVE POTENTIAL",
        ]);
        toast.success("Moonshot Intel Acquired: +50 XP", {
          description: "Rank progress updated.",
        });
        checkProStatus?.();
      }
    } catch (error) {
      // Use 'error' instead of 'err'
      console.error(error);
      if (error.response?.status === 403) setTrialExpired(true);
      setLogs((prev) => [...prev, ">> ERROR: ALPHA STREAM COMPROMISED"]);
    } finally {
      // setMoonshotLoading(false); // Removed unused state
      checkProStatus?.();
    }
  }

  const profitable = results.filter((r) => r.isProfitable);

  const speculative = results.filter((r) => !r.isProfitable);

  const renderSwarm = () => {
    const count = Math.min(Math.floor(scanLimit / 10), 20);
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(count, 5)}, 1fr)`,
          gap: 8,
          maxWidth: 320,
          margin: "20px auto",
          position: "relative",
        }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const status =
            i < count * 0.3 ? "scout" : i < count * 0.7 ? "scan" : "strike";
          const colors = {
            scout: "#0ea5e9",
            scan: "#10b981",
            strike: "#f59e0b",
          };
          const labels = { scout: "SCOUT", scan: "SCAN", strike: "STRIKE" };
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                animation: `swarmPulse 2s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `radial-gradient(circle, ${colors[status]}22 0%, transparent 70%)`,
                  border: `1px solid ${colors[status]}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: `0 0 ${12 + i * 2}px ${colors[status]}33`,
                }}
              >
                <RandomNinja width={22} height={22} />
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: colors[status],
                    animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                    boxShadow: `0 0 6px ${colors[status]}`,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  color: colors[status],
                  fontFamily: "monospace",
                  opacity: 0.7,
                }}
              >
                {labels[status]}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="pro-dashboard-page"
      className="page"
      style={{ paddingBottom: 80, minHeight: "100vh", background: "#050510" }}
    >
      <div className="container" style={{ padding: "0 20px" }}>
        {/* 1. Header & Live Monitor */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 40,
            paddingTop: 20,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div className="holo-box">
              <NinjaAI width={60} height={60} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  background: "linear-gradient(to right, #fff, #99f)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-1px",
                }}
              >
                Command Center
              </h1>
              <div
                style={{
                  fontFamily: "monospace",
                  color: "var(--emerald)",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span className="pulse-dot"></span> SYSTEM ONLINE :: CHANNELS
                SECURE
              </div>
            </div>
          </div>

          <div
            className="glass-card terminal-window"
            style={{
              minWidth: 280,
              flex: 1,
              maxWidth: 400,
              height: 100,
              padding: 12,
              fontFamily: "monospace",
              fontSize: 10,
              color: "var(--primary)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              border: "1px solid var(--primary-dark)",
            }}
          >
            {logs.slice(-6).map((log, i) => (
              <div key={i} style={{ opacity: (i + 1) / 6 }}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 30,
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "scan", label: "Market Scanner", icon: Target },
            {
              id: "intelligence",
              label: "AI Intelligence",
              icon: BrainCircuit,
            },
            {
              id: "moonshot",
              label: "Moonshot Scout",
              icon: Zap,
              highlight: true,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "moonshot" && moonshotResults.length === 0)
                  runMoonshotScan();
              }}
              className="nav-tab-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 24px",
                borderRadius: 14,
                border:
                  activeTab === tab.id
                    ? "1px solid var(--primary)"
                    : "1px solid var(--ninja-border)",
                background:
                  activeTab === tab.id
                    ? "rgba(14, 165, 233, 0.15)"
                    : "rgba(15, 23, 42, 0.4)",
                color: activeTab === tab.id ? "white" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                fontWeight: 700,
                fontSize: 13,
                boxShadow:
                  activeTab === tab.id && tab.highlight
                    ? "0 0 20px rgba(245, 158, 11, 0.3)"
                    : activeTab === tab.id
                      ? "0 0 15px rgba(14, 165, 233, 0.2)"
                      : "none",
                borderColor:
                  activeTab === tab.id && tab.highlight
                    ? "var(--warning)"
                    : undefined,
                transform: activeTab === tab.id ? "translateY(-2px)" : "none",
              }}
            >
              <tab.icon
                size={18}
                color={
                  activeTab === tab.id
                    ? tab.highlight
                      ? "var(--warning)"
                      : "var(--primary)"
                    : undefined
                }
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trial Expired / Pro Upgrade Wall */}
        {trialExpired ? (
          <div
            className="animate-enter"
            style={{
              marginTop: 40,
              padding: 40,
              borderRadius: 24,
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(15,23,42,0.9) 100%)",
              border: "1px solid var(--crimson)",
            }}
          >
            <Shield
              size={64}
              color="var(--crimson)"
              style={{ marginBottom: 20 }}
            />
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
              Free Trial Expired
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                maxWidth: 500,
                margin: "0 auto 32px",
                fontSize: 16,
              }}
            >
              You've experienced the power of KAGE AI. Access to deep scanners
              and intelligence channels now requires a Pro subscription.
            </p>
            <button
              className="btn btn-primary btn-xl glow-effect"
              style={{ padding: "16px 48px", minWidth: 260 }}
              onClick={() => (window.location.href = "/plans")}
            >
              Get Lifetime Pro — ₹999
            </button>
          </div>
        ) : (
          <>
            {/* 2. Control Deck */}
            {activeTab === "scan" && !loading && !showResults && (
              <div
                className="command-deck"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  background:
                    "radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 70%)",
                  border: "1px solid var(--ninja-border)",
                  borderRadius: 24,
                  marginBottom: 40,
                }}
              >
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                  Initialize Scan Protocol
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: 30 }}>
                  Select Universe Breadth
                </p>
                <div style={{ width: "100%", maxWidth: 400, marginBottom: 20 }}>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    step={10}
                    value={scanLimit}
                    onChange={(e) => setScanLimit(Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: "var(--primary)",
                      cursor: "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>RECON</span>
                    <span>DEEP DIVE</span>
                  </div>
                </div>
                <div style={{ marginBottom: 30, textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      color: "var(--primary)",
                      marginBottom: 8,
                    }}
                  >
                    Agents Ready: {Math.floor(scanLimit / 10)} SQUADS
                  </div>
                  {renderSwarm()}
                </div>
                <button
                  className="btn btn-primary btn-xl glow-effect"
                  onClick={runScan}
                  style={{
                    padding: "16px 48px",
                    fontSize: 18,
                    fontWeight: 900,
                    width: "100%",
                    maxWidth: 320,
                  }}
                >
                  INITIATE
                </button>
              </div>
            )}

            {/* 3. Loading Phase */}
            {activeTab === "scan" && loading && (
              <div
                style={{
                  padding: "40px 20px",
                  borderRadius: 24,
                  background:
                    "radial-gradient(ellipse at center, rgba(14,165,233,0.05) 0%, transparent 70%)",
                  border: "1px solid var(--ninja-border)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--primary)",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    Strike Team Deployed
                  </h3>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    Infiltrating {scanLimit} Market Sectors
                  </p>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                    marginBottom: 32,
                  }}
                >
                  {[
                    {
                      name: "Kage Scout",
                      status: "Infiltrating Dark Pools...",
                      icon: NinjaTarget,
                      color: "#0ea5e9",
                    },
                    {
                      name: "Momentum Shinobi",
                      status: "Observing Volume Volatility...",
                      icon: NinjaRocket,
                      color: "#10b981",
                    },
                    {
                      name: "Tactical Recon",
                      status: "Scanning Sector Defenses...",
                      icon: NinjaSlicing,
                      color: "#ef4444",
                    },
                    {
                      name: "Alpha Assassin",
                      status: "Marking High-Value Targets...",
                      icon: NinjaSuccess,
                      color: "#f59e0b",
                    },
                  ].map((agent, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(15,23,42,0.6)",
                        borderRadius: 14,
                        padding: 16,
                        border: `1px solid ${agent.color}22`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                          animation: `scanLine 2s ${i * 0.5}s ease-in-out infinite`,
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${agent.color}15`,
                            border: `1px solid ${agent.color}33`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <agent.icon width={20} height={20} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: agent.color,
                            }}
                          >
                            {agent.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontFamily: "monospace",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              maxWidth: 140,
                            }}
                          >
                            {agent.status}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: agent.color,
                            borderRadius: 2,
                            animation: `progress 3s ${i * 0.4}s ease-in-out infinite`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      margin: "0 auto 16px",
                      animation: "float 3s ease-in-out infinite",
                      filter: "drop-shadow(0 0 20px rgba(14,165,233,0.4))",
                    }}
                  >
                    <NinjaAI width={80} height={80} />
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "var(--primary)",
                      letterSpacing: "1px",
                      animation: "blink 1.5s step-end infinite",
                    }}
                  >
                    GATHERING INTEL...
                  </div>
                </div>
              </div>
            )}

            {/* 4. Results Phase */}
            {activeTab === "scan" && showResults && (
              <div className="results-grid animate-enter">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginBottom: 40,
                  }}
                >
                  <StatBox
                    label="Targets Acquired"
                    value={results.length}
                    icon={NinjaHeadOne}
                    color="var(--text-primary)"
                  />
                  <StatBox
                    label="Alpha Identified"
                    value={profitable.length}
                    icon={NinjaSuccess}
                    color="var(--emerald)"
                  />
                  <StatBox
                    label="Hostile Alerts"
                    value={speculative.length}
                    icon={NinjaRocket}
                    color="var(--crimson)"
                  />
                  <StatBox
                    label="Peak Intensity"
                    value={
                      results.length > 0
                        ? Math.max(...results.map((r) => r.score))
                        : 0
                    }
                    icon={NinjaTarget}
                    color="var(--sky)"
                  />
                </div>
                {profitable.length > 0 && (
                  <Section
                    title="Strategic Scrolls (High-Value Targets)"
                    icon={Crown}
                    color="var(--emerald)"
                  >
                    <div className="card-grid">
                      {profitable.map((stock, i) => (
                        <StockResultCard
                          key={i}
                          stock={stock}
                          onSelect={() => setSelectedStock(stock)}
                          highlight
                          // selected={selectedTickers.has(stock.ticker)} // Removed unused prop
                          // onToggleSelect={() => toggleTicker(stock.ticker)} // Removed unused prop
                        />
                      ))}
                    </div>
                  </Section>
                )}
                {speculative.length > 0 && (
                  <Section
                    title="Moonshot Briefings (Speculative)"
                    icon={Flame}
                    color="var(--crimson)"
                  >
                    <div className="card-grid">
                      {speculative.map((stock, i) => (
                        <StockResultCard
                          key={i}
                          stock={stock}
                          onSelect={() => setSelectedStock(stock)}
                          // selected={selectedTickers.has(stock.ticker)} // Removed unused prop
                          // onToggleSelect={() => toggleTicker(stock.ticker)} // Removed unused prop
                        />
                      ))}
                    </div>
                  </Section>
                )}
                <div style={{ textAlign: "center", marginTop: 40 }}>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setSelectedTickers(new Set());
                    }}
                    className="btn btn-secondary"
                  >
                    Resume Scouting
                  </button>
                </div>
              </div>
            )}
            {/* 5. Intelligence Phase (Removed Static Components) */}
            {activeTab === "intelligence" && (
              <div
                className="glass-card"
                style={{ padding: 40, textAlign: "center" }}
              >
                <div style={{ fontSize: 16, color: "var(--text-muted)" }}>
                  Live Market Intelligence is currently being upgraded. Check
                  back soon for real-time sector analysis.
                </div>
              </div>
            )}

            {/* 6. Moonshot Phase */}
            {activeTab === "moonshot" && (
              <div className="moonshot-results animate-enter">
                {moonshotResults.length === 0 ? (
                  <div style={{ height: 500 }}>
                    <SmartLoader
                      sequence={[
                        {
                          text: "Scanning 10x Opportunities...",
                          Component: NinjaTarget,
                        },
                        {
                          text: "Analyzing Insider Flow...",
                          Component: NinjaMeditating,
                        },
                        {
                          text: "Calculating Moonshot Probability...",
                          Component: NinjaLogic,
                        },
                        {
                          text: "Locking Alpha Targets...",
                          Component: NinjaRocket,
                        },
                      ]}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)",
                        borderLeft: "4px solid var(--warning)",
                        padding: "20px 24px",
                        borderRadius: "0 16px 16px 0",
                        marginBottom: 40,
                      }}
                    >
                      <h2
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: "white",
                          marginBottom: 4,
                        }}
                      >
                        Top 5 Alpha Moonshots
                      </h2>
                      <p style={{ color: "var(--text-secondary)" }}>
                        Highest confidence targets for exponential growth based
                        on multi-level intelligence.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                      }}
                    >
                      {moonshotResults.map((stock, i) => (
                        <div
                          key={i}
                          className="glass-card moonshot-card"
                          style={{
                            padding: 0,
                            overflow: "hidden",
                            border: "1px solid rgba(245, 158, 11, 0.2)",
                            background:
                              "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(5, 5, 16, 0.95) 100%)",
                          }}
                        >
                          <div style={{ display: "flex", flexWrap: "wrap" }}>
                            {/* Visual Rank Section */}
                            <div
                              style={{
                                width: 80,
                                background: "rgba(245, 158, 11, 0.05)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRight:
                                  "1px solid rgba(245, 158, 11, 0.1)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 48,
                                  fontWeight: 900,
                                  color: "rgba(245, 158, 11, 0.2)",
                                }}
                              >
                                #{i + 1}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: "var(--warning)",
                                  letterSpacing: "2px",
                                }}
                              >
                                RANK
                              </div>
                            </div>

                            {/* Main Content */}
                            <div style={{ flex: 1, padding: 24 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: 20,
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      marginBottom: 4,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 32,
                                        fontWeight: 900,
                                        letterSpacing: "-1px",
                                      }}
                                    >
                                      {stock.ticker}
                                    </span>
                                    <span
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        background: "rgba(245, 158, 11, 0.15)",
                                        color: "var(--warning)",
                                        fontSize: 12,
                                        fontWeight: 800,
                                      }}
                                    >
                                      ALPHA SCORE: {stock.moonScore}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    {stock.industry} • {stock.sector}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{ fontSize: 24, fontWeight: 800 }}
                                  >
                                    ${stock.price}
                                  </div>
                                  <div
                                    style={{
                                      color:
                                        stock.upside > 0
                                          ? "var(--emerald)"
                                          : "var(--crimson)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {stock.upside > 0 ? "+" : ""}
                                    {stock.upside}% PROJ. UPSIDE
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                  gap: 16,
                                  marginBottom: 24,
                                }}
                              >
                                <div
                                  style={{
                                    padding: 16,
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-muted)",
                                      textTransform: "uppercase",
                                      marginBottom: 8,
                                    }}
                                  >
                                    AI Intelligence Outlook
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      lineHeight: "1.5",
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    {stock.outlook}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: 16,
                                    borderRadius: 12,
                                    background: "rgba(245, 158, 11, 0.03)",
                                    border: "1px solid rgba(245, 158, 11, 0.1)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "var(--warning)",
                                      textTransform: "uppercase",
                                      marginBottom: 8,
                                    }}
                                  >
                                    10x Potential Reasoning
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 6,
                                    }}
                                  >
                                    {stock.moonReasoning?.map((r, ri) => (
                                      <div
                                        key={ri}
                                        style={{
                                          fontSize: 13,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: "50%",
                                            background: "var(--warning)",
                                          }}
                                        />
                                        {r}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  onClick={() => setSelectedStock(stock)}
                                  className="btn btn-secondary"
                                  style={{ padding: "8px 20px", fontSize: 13 }}
                                >
                                  View Technicals
                                </button>
                                <button
                                  onClick={() => {
                                    runBatchAnalysis([stock.ticker]);
                                  }}
                                  className="btn btn-primary"
                                  style={{ padding: "8px 20px", fontSize: 13 }}
                                >
                                  Deep News Scan
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* News Intelligence Modal */}

        {selectedStock && (
          <StockDetailModal
            ticker={selectedStock.ticker}
            initialData={selectedStock}
            onClose={() => setSelectedStock(null)}
          />
        )}
      </div>

      <style>{`
                #pro-dashboard-page .holo-box { filter: drop-shadow(0 0 10px var(--primary-glow)); }
                #pro-dashboard-page .pulse-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 5px var(--success); animation: pulse 2s infinite; }
                #pro-dashboard-page .glow-effect:hover { transform: scale(1.05); box-shadow: 0 0 50px var(--primary-glow) !important; }
                #pro-dashboard-page .animate-enter { animation: fadeUp 0.6s ease-out; }
                #pro-dashboard-page .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes swarmPulse { from { transform: scale(1); } to { transform: scale(1.08); } }
                @keyframes scanLine { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
                @keyframes progress { 0% { width: 0%; } 50% { width: 85%; } 70% { width: 90%; } 100% { width: 95%; } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @media (max-width: 768px) { 
                    #pro-dashboard-page .card-grid { grid-template-columns: 1fr !important; } 
                    #pro-dashboard-page .command-deck { padding: 32px 16px !important; }
                    #pro-dashboard-page .sentiment-sticky-bar { 
                        padding: 16px !important; 
                        flex-direction: column !important; 
                        gap: 16px !important; 
                        text-align: center;
                        margin-bottom: 24px !important;
                        top: calc(var(--banner-height, 0px) + 74px) !important; 
                    }
                    #pro-dashboard-page .sentiment-sticky-bar .btn { width: 100% !important; }
                    #pro-dashboard-page .sentiment-sticky-bar div { font-size: 14px !important; line-height: 1.4; }
                }
            `}</style>

      {/* Sub-Components defined inside to guarantee access to TrendingUp etc. */}
      <div style={{ display: "none" }}>
        <StockResultCard
          stock={{ ticker: "FIX", price: 0, upside: 0, score: 0 }}
          onSelect={() => {}}
        />
      </div>
    </div>
  );

  function StockResultCard({
    stock,
    onSelect,
    highlight = false,
    // selected, // Removed unused prop
    // onToggleSelect, // Removed unused prop
  }) {
    const isUp = stock.upside > 0;
    return (
      <div
        className="glass-card stock-card-interactive"
        style={{
          cursor: "pointer",
          padding: 24,
          position: "relative",
          overflow: "hidden",
          border: highlight
            ? `1px solid ${isUp ? "var(--emerald)44" : "var(--crimson)44"}`
            : "1px solid rgba(255,255,255,0.05)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={onSelect}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                fontFamily: "monospace",
                color: "white",
                letterSpacing: "-0.5px",
              }}
            >
              {stock.ticker}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              INTEL SCORE:{" "}
              <span
                style={{
                  color: stock.score >= 5 ? "var(--emerald)" : "var(--amber)",
                }}
              >
                {stock.score}/10
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
              ${stock.price}
            </div>
            <div
              style={{
                color: isUp ? "var(--emerald)" : "var(--crimson)",
                fontWeight: 700,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 4,
              }}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isUp ? "+" : ""}
              {stock.upside}% PROJ.
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Sensei Strike Plan:
          </div>
          <div style={{ fontSize: 13, color: "var(--sky)", fontWeight: 800 }}>
            ${stock.predicted}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: -10,
            right: -10,
            opacity: 0.1,
            transform: "rotate(-20deg)",
          }}
        >
          <NinjaTarget width={60} height={60} />
        </div>
      </div>
    );
  }
}

const StatBox = ({ label, value, icon: Icon, color }) => (
  <div
    className="glass-card"
    style={{
      padding: 20,
      display: "flex",
      alignItems: "center",
      gap: 16,
      borderLeft: `4px solid ${color}`,
    }}
  >
    <div style={{ opacity: 0.8 }}>
      <Icon width={40} height={40} />
    </div>
    <div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: color }}>{value}</div>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children, color }) => (
  <div style={{ marginBottom: 40 }}>
    <h2
      style={{
        fontSize: 20,
        fontWeight: 700,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: color,
      }}
    >
      <Icon size={24} /> {title}
    </h2>
    {children}
  </div>
);
