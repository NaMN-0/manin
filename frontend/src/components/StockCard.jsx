import { TrendingUp, TrendingDown, Rocket, Eye, Hand } from "lucide-react";

export default function StockCard({ stock, onClick, compact = false }) {
  const isPositive = stock.changePct >= 0;

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(42,42,58,0.5)",
          cursor: onClick ? "pointer" : "default",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--ninja-surface-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "var(--font-mono)",
            }}
          >
            {stock.ticker}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>
            ${stock.price?.toFixed(2)}
          </span>
          <span className={`badge ${isPositive ? "badge-green" : "badge-red"}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {stock.changePct >= 0 ? "+" : ""}
            {stock.changePct?.toFixed(2)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
            }}
          >
            {stock.ticker}
          </h3>
          <p style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            ${stock.price?.toFixed(2)}
          </p>
        </div>
        <span
          className={`badge ${isPositive ? "badge-green" : "badge-red"}`}
          style={{ fontSize: 13, padding: "6px 12px" }}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {stock.changePct >= 0 ? "+" : ""}
          {stock.changePct?.toFixed(2)}%
        </span>
      </div>

      {stock.signals && stock.signals.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}
        >
          {stock.signals.map((sig, i) => {
            const isVelocity =
              sig.includes("Vertical") ||
              sig.includes("Velocity") ||
              sig.includes("Acceleration");
            return (
              <span
                key={i}
                style={{
                  padding: "4px 8px",
                  background: isVelocity
                    ? "rgba(239, 68, 68, 0.1)"
                    : "var(--ninja-surface)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 11,
                  color: isVelocity
                    ? "var(--red-glow)"
                    : "var(--text-secondary)",
                  border: isVelocity
                    ? "1px solid var(--red-glow)"
                    : "1px solid var(--ninja-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {isVelocity && <Rocket size={10} />}
                {sig}
              </span>
            );
          })}
        </div>
      )}

      {stock.verdict && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            background:
              stock.verdict === "STRONG BUY"
                ? "rgba(16,185,129,0.1)"
                : stock.verdict === "WATCHLIST"
                  ? "rgba(245,158,11,0.1)"
                  : "var(--ninja-surface)",
            color:
              stock.verdict === "STRONG BUY"
                ? "var(--emerald-glow)"
                : stock.verdict === "WATCHLIST"
                  ? "var(--amber-glow)"
                  : "var(--text-muted)",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {stock.verdict === "STRONG BUY" ? (
            <Rocket size={14} />
          ) : stock.verdict === "WATCHLIST" ? (
            <Eye size={14} />
          ) : (
            <Hand size={14} />
          )}
          {stock.verdict}
        </div>
      )}
    </div>
  );
}
