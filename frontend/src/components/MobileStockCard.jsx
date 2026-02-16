import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

export default function MobileStockCard({ stock, onClick, showVolume = true }) {
  const isUp =
    stock.changePct !== undefined ? stock.changePct >= 0 : stock.upside >= 0;
  const changeVal =
    stock.changePct !== undefined ? stock.changePct : stock.upside;
  const price = stock.price
    ? stock.price.toFixed(stock.price < 1 ? 4 : 2)
    : "0.00";

  // Determine gradient for mini-chart background effect
  const gradient = isUp
    ? "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1))"
    : "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1))";

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--ninja-surface)",
        border: "1px solid var(--ninja-border)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Background Gradient Effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "60%",
          background: gradient,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Left: Ticker & Name */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 900,
            fontFamily: "var(--font-mono)",
          }}
        >
          {stock.ticker}
        </div>
        {showVolume && stock.volume && (
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
          >
            Vol: {(stock.volume / 1000000).toFixed(2)}M
          </div>
        )}
      </div>

      {/* Right: Price & Change */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            ${price}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isUp ? "var(--emerald)" : "var(--crimson)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 4,
            }}
          >
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {changeVal > 0 ? "+" : ""}
            {changeVal}%
          </div>
        </div>
        <ChevronRight size={18} color="var(--text-muted)" />
      </div>
    </div>
  );
}
