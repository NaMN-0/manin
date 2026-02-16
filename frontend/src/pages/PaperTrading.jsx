import { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
// import { useAuth } from "../context/AuthContext";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Sword,
  Scroll,
} from "lucide-react";
import {
  // NinjaDojo, // Removed unused import
  NinjaMaster,
  NinjaPennyRocket,
} from "../components/NinjaIllustrations";

export default function PaperTrading() {
  const { xp, level, rank, virtualCash } = useGame();
  // const { user } = useAuth(); // user is assigned a value but never used
  const [holdings, setHoldings] = useState([]);
  // const [loading, setLoading] = useState(true); // loading is assigned a value but never used

  // Mock holdings for now
  useEffect(() => {
    const timer = setTimeout(() => {
      setHoldings([
        {
          ticker: "AAPL",
          quantity: 10,
          entry: 185.2,
          current: 192.45,
          pnl: 72.5,
          status: "active",
        },
        {
          ticker: "TSLA",
          quantity: 5,
          entry: 240.15,
          current: 235.8,
          pnl: -21.75,
          status: "active",
        },
        {
          ticker: "NVDA",
          quantity: 15,
          entry: 450.0,
          current: 480.2,
          pnl: 453.0,
          status: "active",
        },
      ]);
      // setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const portfolioValue =
    virtualCash + holdings.reduce((sum, h) => sum + h.current * h.quantity, 0);

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <div className="container">
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
            paddingTop: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 900,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              Paper Trading <span className="text-gradient">Dojo</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
              Training Grounds Level:{" "}
              <strong style={{ color: "var(--primary)" }}>{level}</strong> •{" "}
              {rank}
            </p>
          </div>
          <div
            className="glass-card"
            style={{ padding: "12px 24px", border: "1px solid var(--primary)" }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              VIRTUAL POWER
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>
              $
              {portfolioValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >
          <div className="glass-card" style={{ padding: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign size={24} color="var(--emerald)" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  AVAILABLE CASH
                </div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>
                  $
                  {virtualCash.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Earn more cash by scanning sectors and completing missions in the
              Dojo.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(14, 165, 233, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={24} color="var(--primary)" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  MISSION UNREALIZED P&L
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: totalPnl >= 0 ? "var(--emerald)" : "var(--crimson)",
                  }}
                >
                  {totalPnl >= 0 ? "+" : ""}$
                  {totalPnl.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: "100%",
                  height: 4,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    width: "65%",
                    height: "100%",
                    background: "var(--primary)",
                    borderRadius: 2,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                65% Win Rate
              </span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(245, 158, 11, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={24} color="var(--amber)" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  XP PROGRESS
                </div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{xp} XP</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Next Rank: <strong>Ronin</strong> (Earn {300 - xp} more XP)
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Scroll size={24} color="var(--primary)" /> Active Battlefronts
              (Holdings)
            </h2>
            <button
              className="btn btn-sm btn-secondary"
              style={{ borderRadius: 12 }}
            >
              History <Clock size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>

          <div
            className="glass-card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ASSET</th>
                    <th>QUANTITY</th>
                    <th>ENTRY PRICE</th>
                    <th>CURRENT PRICE</th>
                    <th>PROFIT/LOSS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, color: "white" }}>
                        {h.ticker}
                      </td>
                      <td>{h.quantity}</td>
                      <td>${h.entry.toFixed(2)}</td>
                      <td>${h.current.toFixed(2)}</td>
                      <td
                        style={{
                          color:
                            h.pnl >= 0 ? "var(--emerald)" : "var(--crimson)",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {h.pnl >= 0 ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}
                          {h.pnl >= 0 ? "+" : ""}${Math.abs(h.pnl).toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ padding: "4px 12px", fontSize: 11 }}
                        >
                          SELL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Training Missions Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 32,
          }}
        >
          <div
            className="glass-card"
            style={{ padding: 40, position: "relative", overflow: "hidden" }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                opacity: 0.1,
              }}
            >
              <NinjaPennyRocket width={200} height={200} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
              Daily Training
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Target size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    Scan 3 Sectors
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Progress: 1/3
                  </div>
                </div>
                <div
                  style={{
                    color: "var(--amber)",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  +300 $
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--emerald)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sword size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    Execute 5 Strikes
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Progress: 2/5
                  </div>
                </div>
                <div
                  style={{
                    color: "var(--amber)",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  +1000 $
                </div>
              </div>
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: 40,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NinjaMaster
              width={120}
              height={120}
              style={{ marginBottom: 24 }}
            />
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Become a Kage
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              Your simulated performance determines your rank. Master the dojo
              to unlock institutional-grade AI scanners.
            </p>
            <button
              className="btn btn-primary shine-effect"
              style={{ width: "100%" }}
            >
              EXPLORE ADVANCED SCANNER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
