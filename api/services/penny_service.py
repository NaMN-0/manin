"""
Penny stock analysis service — wraps existing penny_loader.py and penny_server.py logic.
"""

import warnings
import traceback
from typing import Optional, List

import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import pytz
from datetime import datetime

warnings.filterwarnings("ignore")

try:
    import penny_loader
except ImportError:
    penny_loader = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _market_progress() -> float:
    ny = pytz.timezone("US/Eastern")
    now = datetime.now(ny)
    market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
    market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)
    if now < market_open:
        return 0.0
    elif now > market_close:
        return 1.0
    total = (market_close - market_open).total_seconds()
    elapsed = (now - market_open).total_seconds()
    return elapsed / total


# ─── Universe ─────────────────────────────────────────────────────────────────

_cached_universe: Optional[list] = None
_cache_time: Optional[datetime] = None


def get_universe() -> list:
    global _cached_universe, _cache_time
    if _cached_universe and _cache_time:
        if (datetime.now() - _cache_time).seconds < 3600:
            return _cached_universe
    if penny_loader:
        _cached_universe = penny_loader.get_penny_stocks()
    else:
        _cached_universe = []
    _cache_time = datetime.now()
    return _cached_universe


# ─── Basic scan (free after login) ───────────────────────────────────────────

import requests

# ─── Basic scan (free after login) ───────────────────────────────────────────

def get_basic_penny_list(limit: int = 50) -> list:
    """Returns basic penny stock data: ticker, price, volume. No deep analysis."""
    universe = get_universe()
    if not universe:
        return []

    # Take a manageable subset
    tickers = universe[:200]
    results = []

    chunk_size = 50
    for i in range(0, len(tickers), chunk_size):
        batch = tickers[i : i + chunk_size]
        try:
            try:
                # Increased timeout and added error handling
                data = yf.download(batch, period="5d", group_by="ticker", threads=True, progress=False, timeout=20)
            except (requests.exceptions.Timeout, Exception) as e:
                print(f"Batch download timeout/error: {e}")
                # Retry once with longer timeout
                try:
                    data = yf.download(batch, period="5d", group_by="ticker", threads=True, progress=False, timeout=30)
                except Exception:
                    print(f"Retry failed for batch {i}")
                    continue
            
            if data is None or data.empty:
                continue

            for ticker in batch:
                try:
                    if len(batch) == 1:
                        df = data
                    else:
                        if ticker not in data.columns.levels[0]:
                            continue
                        df = data[ticker]
                    
                    if df.empty:
                        continue
                        
                    latest = df.iloc[-1]
                    if pd.isna(latest["Close"]):
                        continue
                        
                    price = float(latest["Close"])
                    volume = float(latest["Volume"])
                    
                    if price < 5.0 and volume > 10000:
                        results.append(
                            {
                                "ticker": ticker,
                                "price": round(price, 4),
                                "volume": int(volume),
                                "high": round(float(latest["High"]), 4),
                                "low": round(float(latest["Low"]), 4),
                            }
                        )
                except Exception:
                    continue
        except Exception as e:
            print(f"Critical batch error: {e}")
            continue

    results.sort(key=lambda x: x["volume"], reverse=True)
    return results[:limit]


# ─── Full deep scan (pro only) ───────────────────────────────────────────────

def run_full_scan(limit: int = 100) -> list:
    """Full AI scan with predictions, signals, and scoring. Pro only."""
    universe = get_universe()
    if not universe:
        return []

    # Phase 1: Rapid screen
    filtered = []
    chunk_size = 200
    for i in range(0, len(universe), chunk_size):
        batch = universe[i : i + chunk_size]
        try:
            try:
                data = yf.download(batch, period="5d", group_by="ticker", threads=True, progress=False, timeout=20)
            except (requests.exceptions.Timeout, Exception):
                try:
                    data = yf.download(batch, period="5d", group_by="ticker", threads=True, progress=False, timeout=30)
                except Exception:
                    continue

            if data is None or data.empty:
                continue
            
            for ticker in batch:
                try:
                    if len(batch) == 1:
                        df = data
                    else:
                        if ticker not in data.columns.levels[0]:
                            continue
                        df = data[ticker]
                    if df.empty:
                        continue
                    latest = df.iloc[-1]
                    if pd.isna(latest["Close"]) or pd.isna(latest["Volume"]):
                        continue
                    p = float(latest["Close"])
                    v = float(latest["Volume"])
                    if p < 5.0 and v > 20000:
                        filtered.append({"ticker": ticker, "vol": v})
                except Exception:
                    continue
        except Exception:
            continue

    filtered.sort(key=lambda x: x["vol"], reverse=True)
    targets = [x["ticker"] for x in filtered[:limit]]

    # Phase 2: Deep analysis
    market_prog = _market_progress()
    results = []

    for ticker in targets:
        res = _deep_analyze(ticker, market_prog)
        if res:
            results.append(res)

    results.sort(key=lambda x: (1 if x["isProfitable"] else 0, x["upside"]), reverse=True)
    return results


def _deep_analyze(ticker: str, market_progress: float = 1.0) -> Optional[dict]:
    """Deep analysis on a single penny stock."""
    try:
        import pandas_ta_classic as ta

        stock = yf.Ticker(ticker)
        df = stock.history(period="6mo")
        if df.empty or len(df) < 30:
            return None

        # Flatten columns
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Profit margin
        try:
            info = stock.info
            profit_margin = info.get("profitMargins", 0) or 0
            market_cap = info.get("marketCap", 0)
            trailing_pe = info.get("trailingPE", 0)
            sector = info.get("sector", "Unknown")
            industry = info.get("industry", "Unknown")
            high_52 = info.get("fiftyTwoWeekHigh", 0)
            low_52 = info.get("fiftyTwoWeekLow", 0)
            float_shares = info.get("floatShares", 0)
        except Exception:
            profit_margin = 0
            market_cap = 0
            trailing_pe = 0
            sector = "Unknown"
            industry = "Unknown"
            high_52 = 0
            low_52 = 0
            float_shares = 0

        # Technical indicators
        df.ta.rsi(length=14, append=True)
        df.ta.sma(length=20, append=True)
        df.ta.sma(length=50, append=True)
        df.ta.bbands(length=20, std=2, append=True)
        df["Vol_SMA_20"] = df["Volume"].rolling(20).mean()

        latest = df.iloc[-1]

        # Projected volume
        current_vol = float(latest["Volume"])
        if 0.1 < market_progress < 1.0:
            projected_vol = current_vol / market_progress
        else:
            projected_vol = current_vol
        avg_vol = float(latest["Vol_SMA_20"]) if not pd.isna(latest["Vol_SMA_20"]) else 1

        # Predictive model
        try:
            data_copy = df.copy()
            data_copy["Target"] = data_copy["Close"].shift(-1)
            data_copy = data_copy.dropna()
            feature_cols = ["Open", "High", "Low", "Volume"]
            if "RSI_14" in data_copy.columns:
                feature_cols.append("RSI_14")
            X = data_copy[feature_cols]
            y = data_copy["Target"]
            model = LinearRegression()
            model.fit(X, y)
            latest_features = latest[feature_cols].values.reshape(1, -1)
            predicted_price = float(model.predict(latest_features)[0])
        except Exception:
            predicted_price = float(latest["Close"])

        # Signals
        signals = []
        score = 0
        vol_ratio = projected_vol / avg_vol if avg_vol > 0 else 0
        if vol_ratio > 2.0:
            signals.append(f"Massive Volume ({vol_ratio:.1f}x)")
            score += 2
        elif vol_ratio > 1.5:
            signals.append(f"High Volume ({vol_ratio:.1f}x)")
            score += 1

        if latest["Close"] > latest.get("SMA_20", 0):
            signals.append("Above 20-SMA")
            score += 1

        try:
            if latest["Close"] > latest["BBU_20_2.0"]:
                signals.append("Upper Bollinger Breakout")
        except KeyError:
            pass

        is_profitable = profit_margin > 0
        if is_profitable:
            signals.append(f"Profitable ({profit_margin * 100:.1f}%)")
            score += 3

        price = float(latest["Close"])
        upside = ((predicted_price - price) / price) * 100

        # Price history for charts
        price_history = [
            {"date": d.strftime("%Y-%m-%d"), "close": round(float(c), 2)}
            for d, c in zip(df.index[-60:], df["Close"].iloc[-60:])
        ]

        return {
            "ticker": ticker,
            "price": round(price, 4),
            "predicted": round(predicted_price, 4),
            "upside": round(upside, 1),
            "margin": round(profit_margin * 100, 1),
            "isProfitable": is_profitable,
            "score": score,
            "signals": signals,
            "volume": int(current_vol),
            "projVolume": int(projected_vol),
            "priceHistory": price_history,
            "marketCap": market_cap,
            "pe": trailing_pe,
            "sector": sector,
            "industry": industry,
            "yearHigh": high_52,
            "yearLow": low_52,
            "float": float_shares,
        }
    except Exception:
        traceback.print_exc()
        return None


def analyze_single_penny(ticker: str) -> Optional[dict]:
    """Analyze a single penny stock in depth."""
    return _deep_analyze(ticker, _market_progress())
