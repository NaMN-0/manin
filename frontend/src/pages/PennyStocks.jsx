import { useEffect, useState } from "react";
// import { Link } from "react-router-dom"; // Unused Link import
// import client from "../api/client"; // Removed unused client import
import { marketApi } from "../api/market"; // Use the new marketApi
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import {
  Zap,
  Filter,
  Terminal,
  Brain,
  Crown, // Keep Crown as it's used in Top Picks
  ShieldCheck, // Keep ShieldCheck for Accuracy
} from "lucide-react";
import NinjaTrainingLoader from "../components/NinjaTrainingLoader";
import StockDetailModal from "../components/StockDetailModal";
// import MobileStockCard from "../components/MobileStockCard"; // Unused MobileStockCard
import {
  // NinjaPennyRocket, // Unused NinjaPennyRocket
  // NinjaMaster, // Unused NinjaMaster
  NinjaDojo, // Keep NinjaDojo for error state
  // NinjaLogic, // Unused NinjaLogic
} from "../components/NinjaIllustrations";
import { usePostHog } from "posthog-js/react";

export default function PennyStocks() {
  useAuth(); // No longer destructuring, as nothing from useAuth is directly used here
  const { addXp } = useGame();
  const [stocks, setStocks] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCracking, setIsCracking] = useState(false);
  const [error, setError] = useState(null);
  // const [currentLetter, setCurrentLetter] = useState("A"); // Unused
  const [displayLetter, setDisplayLetter] = useState("A");
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const posthog = usePostHog();

  useEffect(() => {
    const loadWatchlist = () => {
      const saved = JSON.parse(localStorage.getItem("ninjaWatchlist") || "[]");
      setWatchlist(saved.sort((a, b) => b.addedAt - a.addedAt));
    };
    loadWatchlist();

    window.addEventListener("watchlistUpdated", loadWatchlist);
    return () => window.removeEventListener("watchlistUpdated", loadWatchlist);
  }, []);

  const removeFromWatchlist = (e, ticker) => {
    e.stopPropagation();
    const newWatchlist = watchlist.filter((item) => item.ticker !== ticker);
    localStorage.setItem("ninjaWatchlist", JSON.stringify(newWatchlist));
    setWatchlist(newWatchlist);
  };

  useEffect(() => {
    posthog?.capture("viewed_smart_discovery");
    fetchNextBatch();
  }, [posthog]);

  async function fetchNextBatch() {
    if (isCracking) return;
    setLoading(true);
    setError(null);

    // 1. Initiate Code Cracker Animation
    setIsCracking(true);
    const SECTORS = [
      "Technology",
      "Healthcare",
      "Finance",
      "Energy",
      "Consumer Discretionary",
      "Consumer Staples",
      "Industrials",
      "Materials",
      "Utilities",
      "Real Estate",
      "Telecommunications",
    ];

    let crackSteps = 15;
    const interval = setInterval(() => {
      setDisplayLetter(SECTORS[Math.floor(Math.random() * SECTORS.length)]);
      crackSteps--;
      if (crackSteps <= 0) clearInterval(interval);
    }, 80);

    try {
      const randomSector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
      // Pass sector param instead of letter
      const res = await marketApi.scanSmartBatch(
        null,
        "penny",
        "momentum",
        randomSector,
      );
      // This needs to use the new marketApi.scanSmartBatch once it's implemented.
      // const res = await marketApi.scanSmartBatch(null, 'penny', 'momentum', randomSector);

      // Wait for animation if it's too fast
      await new Promise((r) => setTimeout(r, 1200));

      if (res && res.data) {
        // Check res and res.data
        const data = res.data; // Directly use res.data
        // Backend returns 'letter' as key mostly for compat, but might send 'filter_val'
        const sectorName = data.filter_val || data.letter || randomSector;
        // setCurrentLetter(sectorName); // Unused
        if (interval) clearInterval(interval); // Stop animation immediately
        setDisplayLetter(sectorName);
        setStocks(data.candidates || []);
        setTopPicks(data.top_picks || []);
        setAccuracyData(data.accuracy_data || null);

        if (data.candidates.length > 0) {
          const bonus = data.accuracy_data?.accuracy > 70 ? 25 : 10;
          addXp(
            bonus,
            `Cracked Sector ${sectorName} (Accuracy: ${data.accuracy_data?.accuracy}%)`,
          );
        }
      }
    } catch (error) {
      // Use 'error' instead of 'err'
      console.error("Fetch error:", error);
      setError(error.response?.data?.detail || "Failed to crack sector code.");
    } finally {
      setLoading(false);
      setIsCracking(false);
    }
  }

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
        <NinjaTrainingLoader text={isCracking ? "Deciphering Sector Codes..." : "Scanning Global Battlefronts..."} />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Background Decoration */}
      <div
        style={{
          position: "fixed",
          top: -100,
          right: -100,
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <NinjaDojo width={600} height={600} />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>

        {/* Watchlist Section */}
        {watchlist.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Target size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Active Targets</h2>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 16,
                scrollbarWidth: "thin",
              }}
            >
              {watchlist.map((item) => (
                <div
                  key={item.ticker}
                  className="glass-card"
                  onClick={() => setSelectedTicker(item.ticker)}
                  style={{
                    minWidth: 200,
                    padding: 16,
                    borderRadius: 16,
                    border: "1px solid rgba(14, 165, 233, 0.3)",
                    background: "rgba(10, 10, 20, 0.6)",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{item.ticker}</span>
                    <button
                      onClick={(e) => removeFromWatchlist(e, item.ticker)}
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>${item.price?.toFixed(2) || "---"}</span>
                    <span style={{ fontSize: 13, color: (item.changePct >= 0 ? "var(--emerald)" : "var(--crimson)"), fontWeight: 700 }}>
                      {item.changePct > 0 ? "+" : ""}{item.changePct?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Sector Radar UI */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
              <div className="radar-pulse"></div> Sector Radar
            </h2>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
              SCANNING PROTOCOL: ACTIVE
            </div>
          </div>

          <div className="sector-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12
          }}>
            {["Technology", "Healthcare", "Finance", "Energy", "Consumer Discretionary", "Materials", "Industrials", "Real Estate", "Utilities", "Telecommunications"].map((sector) => {
              const isActive = displayLetter === sector;
              return (
                <button
                  key={sector}
                  onClick={() => {
                    if (!loading && displayLetter !== sector) {
                      // Manually trigger fetch for this sector
                      setStocks([]); // Clear current
                      setTopPicks([]);
                      setDisplayLetter(sector);
                      // We need to call the fetch logic. 
                      // Ideally refactor fetchNextBatch to take an arg, 
                      // but for now relying on effect or explicit call.
                      // Let's call a new separate function or refactor fetchNextBatch.
                      marketApi.scanSmartBatch(null, 'penny', 'momentum', sector)
                        .then(res => {
                          if (res.data) {
                            setStocks(res.data.candidates || []);
                            setTopPicks(res.data.top_picks || []);
                            setAccuracyData(res.data.accuracy_data || null);
                            if (res.data.candidates.length > 0) {
                              addXp(10, `Scanned Sector: ${sector}`);
                            }
                          }
                        })
                        .catch(err => {
                          console.error(err);
                          setError("Sector Scan Failed");
                        });
                    }
                  }}
                  className={`sector-chip ${isActive ? "active" : ""}`}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 12,
                    background: isActive ? "rgba(14, 165, 233, 0.15)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                    color: isActive ? "white" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      bottom: 0, left: 0, width: "100%", height: 3,
                      background: "var(--primary)",
                      boxShadow: "0 0 10px var(--primary)"
                    }} />
                  )}
                  {sector}
                </button>
              )
            })}
          </div>
        </div>

        {error ? (
          <div
            className="glass-card"
            style={{ textAlign: "center", padding: 64 }}
          >
            <NinjaDojo
              width={120}
              height={120}
              style={{ opacity: 0.5, marginBottom: 24 }}
            />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Signal Blocked
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={fetchNextBatch}>
              Retry Sequence
            </button>
          </div>
        ) : (
          <>
            {/* Accuracy & Success Rates */}
            {accuracyData && (
              <div
                className="animate-in-up"
                style={{
                  marginBottom: 40,
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div
                  className="glass-card"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: 20,
                    borderLeft: "4px solid var(--emerald)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(16, 185, 129, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ShieldCheck size={24} color="var(--emerald)" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Sensei's Accuracy (7D)
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: "var(--emerald)",
                      }}
                    >
                      {accuracyData.accuracy}%
                    </div>
                  </div>
                </div>
                <div
                  className="glass-card"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: 20,
                    borderLeft: "4px solid var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(14, 165, 233, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Brain size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Intelligence Sample
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: "var(--primary)",
                      }}
                    >
                      {accuracyData.sample_size} Tickers
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Picks Section */}
            {topPicks.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(245, 158, 11, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <Crown size={18} color="var(--amber)" fill="var(--amber)" />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                    High-Probability Targets
                  </h2>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: 24,
                  }}
                >
                  {topPicks.map((pick, i) => (
                    <div
                      key={i}
                      className="glass-card moonshot-card"
                      style={{
                        padding: 0,
                        overflow: "hidden",
                        border: "1px solid rgba(14, 165, 233, 0.2)",
                        background:
                          "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(5, 5, 16, 0.95) 100%)",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          padding: 24,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ marginBottom: 20 }}>
                          <div>
                            <h3
                              style={{
                                fontSize: 32,
                                fontWeight: 900,
                                letterSpacing: "-1px",
                              }}
                            >
                              {pick.ticker}
                            </h3>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--primary)",
                                fontWeight: 700,
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                                marginTop: 4,
                              }}
                            >
                              CONFIDENCE SCORE: {pick.score * 20}%
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>
                              ${pick.price || pick.latest?.Close?.toFixed(3)}
                            </div>
                            <div
                              style={{
                                color: "var(--emerald)",
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {pick.changePct > 0 ? "+" : ""}
                              {pick.changePct ||
                                pick.latest?.change_pct?.toFixed(2)}
                              %
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginBottom: 20,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {pick.signals?.map((sig, j) => (
                            <span
                              key={j}
                              className="badge badge-primary"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                            >
                              {sig}
                            </span>
                          ))}
                        </div>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            marginBottom: 20,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginBottom: 4,
                            }}
                          >
                            Sensei's Predicted Strike:
                          </div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: "var(--sky)",
                            }}
                          >
                            ${(pick.price * 1.2).toFixed(3)}
                          </div>
                        </div>

                        <button
                          className="btn btn-secondary"
                          style={{ width: "100%", height: 48, fontWeight: 700 }}
                          onClick={() => setSelectedTicker(pick.ticker)}
                        >
                          View Intelligence Scroll
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Results Table */}
            <div
              className="glass-card"
              style={{
                padding: 0,
                overflow: "hidden",
                border: "1px solid var(--ninja-border)",
                borderRadius: 20,
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--ninja-border)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>
                  Sector Signals{" "}
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 14,
                      fontWeight: 400,
                    }}
                  >
                    ({stocks.length} Analyzed)
                  </span>
                </h3>
                <Filter size={16} color="var(--text-muted)" />
              </div>
              <div className="table-scroll-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Current Price</th>
                      <th>Trend Flow</th>
                      <th>AI Signal</th>
                      <th>Potential</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock, i) => (
                      <tr
                        key={i}
                        onClick={() => setSelectedTicker(stock.ticker)}
                        style={{ cursor: "pointer" }}
                      >
                        <td
                          style={{
                            fontWeight: 800,
                            color: "white",
                            fontSize: 16,
                          }}
                        >
                          {stock.ticker}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            ${stock.price || stock.latest?.Close?.toFixed(3)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color:
                                stock.changePct >= 0
                                  ? "var(--emerald)"
                                  : "var(--crimson)",
                            }}
                          >
                            {stock.changePct >= 0 ? "+" : ""}
                            {stock.changePct ||
                              stock.latest?.change_pct?.toFixed(2)}
                            %
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background:
                                  stock.score >= 3
                                    ? "var(--emerald)"
                                    : "var(--amber)",
                              }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {stock.score >= 4
                                ? "Bullish Force"
                                : stock.score >= 3
                                  ? "Consolidating"
                                  : "Weak Signal"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {stock.signals?.[0] || "Technical Breakout"}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 4,
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: 2,
                              }}
                            >
                              <div
                                style={{
                                  width: `${stock.score * 20}%`,
                                  height: "100%",
                                  background: "var(--primary)",
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800 }}>
                              {stock.score * 20}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stocks.length === 0 && !loading && (
                <div
                  style={{
                    padding: 60,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No elite signals detected in this sector. Try another?
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {
        selectedTicker && (
          <StockDetailModal
            ticker={selectedTicker}
            onClose={() => setSelectedTicker(null)}
          />
        )
      }

      <style>{`
                @keyframes flicker {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; }
                    100% { opacity: 0.9; }
                }
                .radar-pulse { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 10px var(--success); animation: pulse 2s infinite; }
                @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
                
                .sector-chip:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.3) !important; background: rgba(255,255,255,0.05) !important; }
                .sector-chip.active:hover { background: rgba(14, 165, 233, 0.15) !important; border-color: var(--primary) !important; }
                
                #market-overview-page .moonshot-card:hover { transform: translateY(-4px); border-color: var(--primary) !important; box-shadow: 0 20px 40px -10px rgba(14, 165, 233, 0.2); }
                
                @media (max-width: 768px) {
                    h1 { font-size: 32px !important; }
                    h2 { font-size: 18px !important; }
                    .sector-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important; }
                    .table-scroll-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .data-table { min-width: 600px; }
                    .page { padding-top: 60px !important; }
                    .container { padding: 16px !important; }
                }
            `}</style>
    </div >
  );
}
