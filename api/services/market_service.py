"""
Market analysis service — wraps existing market_loader.py and market_server.py logic.
"""

import warnings
import traceback
from functools import lru_cache
from typing import Optional

import yfinance as yf
import pandas as pd

warnings.filterwarnings("ignore")

# Import existing loaders from parent directory
try:
    import market_loader
except ImportError:
    market_loader = None


# ─── Index overview ───────────────────────────────────────────────────────────

INDICES = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "Dow Jones": "^DJI",
    "Russell 2000": "^RUT",
    "VIX": "^VIX",
}


from services.cache_service import CacheService

# Removed global in-memory cache variables as we used CacheService now

def get_market_overview() -> dict:
    """Returns current values and daily change for major indices + top movers. Uses Supabase Cache (15 min)."""
    
    # Try to get from cache first (15 mins TTL)
    cached_data = CacheService.get("market_overview", max_age_minutes=15)
    if cached_data:
        return cached_data

    # If cache miss or expired, fetch live data
    indices_data = []
    for name, symbol in INDICES.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")
            if hist.empty or len(hist) < 2:
                continue
            current = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2])
            change = current - prev
            change_pct = (change / prev) * 100
            indices_data.append(
                {
                    "name": name,
                    "symbol": symbol,
                    "price": round(current, 2),
                    "change": round(change, 2),
                    "changePct": round(change_pct, 2),
                }
            )
        except Exception:
            continue

    # Top movers from a quick scan of popular tickers
    top_movers = _get_top_movers()
    
    result = {"indices": indices_data, "topMovers": top_movers, "marketOpen": _is_market_open()}
    
    # Save to Supabase Cache
    CacheService.set("market_overview", result)
    
    return result


def _is_market_open() -> bool:
    import pytz
    from datetime import datetime

    ny = pytz.timezone("US/Eastern")
    now = datetime.now(ny)
    if now.weekday() >= 5:
        return False
    hour = now.hour
    minute = now.minute
    if (hour == 9 and minute >= 30) or (10 <= hour < 16):
        return True
    return False


def _get_top_movers() -> list:
    """Quick scan of popular tickers for biggest movers."""
    watchlist = [
        "AAPL", "MSFT", "NVDA", "TSLA", "AMD", "AMZN", "GOOGL", "META",
        "NFLX", "PLTR", "SOFI", "INTC", "BAC", "DIS", "NIO", "RIVN",
    ]
    try:
        data = yf.download(watchlist, period="2d", group_by="ticker", threads=True, progress=False)
        movers = []
        for ticker in watchlist:
            try:
                df = data[ticker] if len(watchlist) > 1 else data
                if df.empty or len(df) < 2:
                    continue
                current = float(df["Close"].iloc[-1])
                prev = float(df["Close"].iloc[-2])
                change_pct = ((current - prev) / prev) * 100
                movers.append(
                    {
                        "ticker": ticker,
                        "price": round(current, 2),
                        "changePct": round(change_pct, 2),
                    }
                )
            except Exception:
                continue
        movers.sort(key=lambda x: abs(x["changePct"]), reverse=True)
        return movers[:10]
    except Exception:
        return []


# ─── Single ticker analysis ──────────────────────────────────────────────────

def analyze_ticker(ticker: str) -> Optional[dict]:
    """Deep technical analysis on a single ticker (reuses market_server logic)."""
    try:
        import pandas_ta_classic as ta

        df = yf.download(ticker, period="6mo", interval="1d", progress=False)
        if df.empty or len(df) < 30:
            return None

        # Flatten MultiIndex
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Indicators
        df.ta.rsi(length=14, append=True)
        df.ta.sma(length=50, append=True)
        df.ta.sma(length=200, append=True)
        df["VOL_SMA_20"] = df["Volume"].rolling(window=20).mean()
        df.ta.macd(append=True)

        latest = df.iloc[-1]
        prev = df.iloc[-2]

        # Strategy scoring
        trend = bool(latest["Close"] > latest.get("SMA_50", 0))
        rsi_val = float(latest.get("RSI_14", 0))
        rsi_bull = 50 < rsi_val < 70
        vol_bull = bool(latest["Volume"] > latest.get("VOL_SMA_20", 0))

        try:
            macd_bull = bool(latest["MACD_12_26_9"] > latest["MACDs_12_26_9"])
        except KeyError:
            macd_bull = False

        score = sum([trend, rsi_bull, vol_bull, macd_bull])
        change_pct = ((float(latest["Close"]) - float(prev["Close"])) / float(prev["Close"])) * 100

        signals = []
        if trend:
            signals.append("Price above 50-day SMA (Uptrend)")
        if rsi_bull:
            signals.append(f"RSI at {rsi_val:.1f} (Strong Momentum)")
        if vol_bull:
            signals.append("Volume above 20-day average")
        if macd_bull:
            signals.append("MACD bullish crossover")

        verdict = "STRONG BUY" if score == 4 else "WATCHLIST" if score == 3 else "NEUTRAL"

        # Price history for chart
        price_history = [
            {"date": d.strftime("%Y-%m-%d"), "close": round(float(c), 2)}
            for d, c in zip(df.index[-60:], df["Close"].iloc[-60:])
        ]

        return {
            "ticker": ticker,
            "price": round(float(latest["Close"]), 2),
            "changePct": round(change_pct, 2),
            "score": score,
            "verdict": verdict,
            "rsi": round(rsi_val, 1),
            "signals": signals,
            "priceHistory": price_history,
        }
    except Exception as e:
        traceback.print_exc()
        return None
