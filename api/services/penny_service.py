"""
Penny stock analysis service — wraps existing penny_loader.py and penny_server.py logic.
"""

import warnings
import traceback
import logging
import gc
from typing import Optional, List
import pytz
from datetime import datetime
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# New Signals Module
from services.signals import check_structure_liquidity, check_wyckoff_spring

warnings.filterwarnings("ignore")

logger = logging.getLogger(__name__)

# ─── Robust Helpers ──────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10),
       retry=retry_if_exception_type((requests.exceptions.RequestException, ImportError, ConnectionError)))
def _safe_download(tickers, period="5d", timeout=15):
    """
    Robust download wrapper with retries.
    """
    import yfinance as yf
    try:
        data = yf.download(tickers, period=period, group_by="ticker", threads=False, progress=False, timeout=timeout)
        if data is None or data.empty:
             # Force retry on empty data if it's expected to exist
             # But yfinance might return empty if market is closed or weird error. 
             # We raise to trigger retry only if it looks like a transient network issue 
             # (hard to distinguish, but let's assume empty means bad fetch here)
             raise requests.exceptions.RequestException("Empty data returned from yfinance")
        return data
    except Exception as e:
        logger.warning(f"Download failed (attempting retry): {e}")
        raise

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


from services.cache_service import CacheService

# ─── Universe ─────────────────────────────────────────────────────────────────

def sanitize_ticker(ticker: str) -> str:
    """Sanitizes ticker symbols for yfinance."""
    ticker = ticker.strip().upper()
    # Replace common preferred/warrant chars
    ticker = ticker.replace("^", "-P").replace("/", "-") 
    return ticker

def get_universe() -> list:
    """Fetches the penny stock universe. Uses Supabase Cache (24 hours)."""
    # Try cache (24h)
    cached = CacheService.get("penny_universe", max_age_minutes=1440)
    if cached:
        return cached

    # If missing, load from scraper
    if penny_loader:
        universe = penny_loader.get_penny_stocks()
        if universe:
            # Sanitize tickers for yfinance (replace ^ and / with -)
            # e.g. "AHT^D" -> "AHT-PD", "AKO/B" -> "AKO-B"
            sanitized = []
            for t in universe:
                t = t.strip().upper()
                if "^" in t:
                    t = t.replace("^", "-P") # yfinance preferred syntax often -P or -
                if "/" in t:
                    t = t.replace("/", "-")
                sanitized.append(t)
            
            CacheService.set("penny_universe", sanitized)
            return sanitized
    
    return []


# ─── Basic scan (free after login) ───────────────────────────────────────────

import requests

# ─── Basic scan (free after login) ───────────────────────────────────────────

def get_basic_penny_list(limit: int = 50) -> list:
    """Returns basic penny stock data using caching and optimized fetching."""
    # 1. Try Cache
    cache_key = f"penny_list_{limit}"
    cached = CacheService.get(cache_key, max_age_minutes=10)
    if cached:
        return cached

    universe = get_universe()
    if not universe:
        return []

    # 2. Optimized Fetching
    # Fetch a bit more than limit to account for filtering (price < 5, vol > 10k)
    # But don't fetch fixed 200 if we only need 50.
    fetch_limit = min(limit * 3, 300) 
    tickers = universe[:fetch_limit]
    
    results = []
    chunk_size = 50
    
    # Process in chunks
    for i in range(0, len(tickers), chunk_size):
        # Stop if we already have enough results
        if len(results) >= limit:
            break

        batch = tickers[i : i + chunk_size]
        try:
            # Robust download with retries
            try:
                data = _safe_download(batch, period="5d", timeout=10)
            except Exception as e:
                logger.error(f"Failed to download batch after retries: {e}")
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
                    
                    if df.empty: continue
                        
                    latest = df.iloc[-1]
                    import pandas as pd
                    if pd.isna(latest["Close"]): continue
                        
                    price = float(latest["Close"])
                    volume = float(latest["Volume"])
                    
                    # Basic Penny Filter
                    if price < 5.0 and volume > 5000: # Lowered vol threshold slightly to ensure we get data
                        
                        # Calculate change
                        change_pct = 0.0
                        try:
                            if len(df) > 1:
                                prev = float(df.iloc[-2]["Close"])
                                if prev > 0:
                                    change_pct = ((price - prev) / prev) * 100
                        except: pass

                        results.append({
                            "ticker": ticker,
                            "price": round(price, 4),
                            "volume": int(volume),
                            "high": round(float(latest["High"]), 4),
                            "low": round(float(latest["Low"]), 4),
                            "changePct": round(change_pct, 2),
                        })
                except: continue
        except: continue

    # Sort by volume desc
    results.sort(key=lambda x: x["volume"], reverse=True)
    final_data = results[:limit]
    
    # 3. Save to Cache
    if final_data:
        CacheService.set(cache_key, final_data)
        
    return final_data


# ─── Full deep scan (pro only) ───────────────────────────────────────────────

def run_full_scan(limit: int = 100) -> list:
    """Full AI scan with predictions, signals, and scoring. Pro only. Cached for 1 hour."""
    # 1. Try Cache
    cache_key = f"full_scan_{limit}"
    cached = CacheService.get(cache_key, max_age_minutes=60)
    if cached:
        return cached

    universe = get_universe()
    if not universe:
        return []

    # Phase 1: Rapid screen
    filtered = []
    chunk_size = 200
    for i in range(0, len(universe), chunk_size):
        batch = universe[i : i + chunk_size]
        try:
            # Robust download logic for full scan
            try:
                data = _safe_download(batch, period="5d", timeout=15)
            except Exception as e:
                logger.error(f"Failed to download batch in full scan: {e}")
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
                    import pandas as pd
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
    # Limit deep analysis to top 300 to prevent timeout
    targets = [x["ticker"] for x in filtered[:300]] 

    # Phase 2: Deep analysis (Optimized for Render Free Tier: Batch + GC)
    market_prog = _market_progress()
    results = []

    # Process targets in small batches to clean memory
    analysis_chunk_size = 50 
    for i in range(0, len(targets), analysis_chunk_size):
        chunk_targets = targets[i : i + analysis_chunk_size]
        
        for ticker in chunk_targets:
            res = _deep_analyze(ticker, market_prog)
            if res:
                results.append(res)
                if len(results) >= limit:
                    break
        
        # Explicit GC after each chunk to free up DataFrame memory
        gc.collect()
        
        if len(results) >= limit:
            break

    results.sort(key=lambda x: (1 if x["isProfitable"] else 0, x["upside"]), reverse=True)
    
    # Save to Cache
    if results:
         CacheService.set(cache_key, results)
         
    return results


def run_batch_scan(limit: int = 10, offset: int = 0) -> list:
    """Runs deep analysis on a small batch of tickers. Used for progressive loading."""
    # 1. Try Cache
    cache_key = f"batch_scan_{limit}_{offset}"
    cached = CacheService.get(cache_key, max_age_minutes=10)
    if cached:
        return cached

    universe = get_universe()
    if not universe:
        return []

    # Slice the universe
    batch_tickers = universe[offset : offset + limit]
    if not batch_tickers:
        return []

    # Phase 1: Screen this batch for basic criteria (Price < $5, Vol > 20k)
    # We do a quick check first to avoid deep analysis on garbage
    filtered_batch = []
    try:
        # Quick check with yfinance on the batch
        # We can reuse the logic from run_full_scan but scoped to this batch
        try:
             import yfinance as yf
             data = yf.download(batch_tickers, period="5d", group_by="ticker", threads=False, progress=False, timeout=10)
        except Exception:
             return []

        if data is None or data.empty:
             return []

        for ticker in batch_tickers:
            try:
                if len(batch_tickers) == 1:
                    df = data
                else:
                    if ticker not in data.columns.levels[0]:
                        continue
                    df = data[ticker]
                
                if df.empty: continue
                
                latest = df.iloc[-1]
                import pandas as pd
                if pd.isna(latest["Close"]) or pd.isna(latest["Volume"]): continue
                
                p = float(latest["Close"])
                v = float(latest["Volume"])
                
                # Basic filter: Penny stock definition + some volume
                if p < 5.0 and v > 10000:
                    filtered_batch.append(ticker)
            except Exception:
                continue
    except Exception:
        pass

    # Phase 2: Deep Analyze the filtered list
    market_prog = _market_progress()
    results = []
    
    for ticker in filtered_batch:
        res = _deep_analyze(ticker, market_prog)
        if res:
            results.append(res)

    # Save to Cache
    if results:
        CacheService.set(cache_key, results)

    return results


def _deep_analyze(ticker: str, market_progress: float = 1.0) -> Optional[dict]:
    """Deep analysis on a single penny stock."""
    try:
        import pandas_ta_classic as ta
        import yfinance as yf
        import pandas as pd
        import numpy as np

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

        # Predictive model (Optimized: swapped sklearn for numpy)
        try:
            data_copy = df.copy()
            data_copy["Target"] = data_copy["Close"].shift(-1)
            data_copy = data_copy.dropna()
            
            # Simple linear regression features (using only Close price for lighter calc if needed, 
            # but sticking to existing logic with numpy linalg)
            feature_cols = ["Open", "High", "Low", "Volume"]
            if "RSI_14" in data_copy.columns:
                feature_cols.append("RSI_14")
                
            X = data_copy[feature_cols].values
            y = data_copy["Target"].values
            
            # Fit linear model using numpy (Least Squares)
            # y = Xw + b -> y = [X 1] [w; b]
            X_b = np.c_[X, np.ones((X.shape[0], 1))]  # add bias term
            theta, residuals, rank, s = np.linalg.lstsq(X_b, y, rcond=None)
            
            latest_features = latest[feature_cols].values.reshape(1, -1)
            latest_features_b = np.c_[latest_features, np.ones((1, 1))]
            
            predicted_price = float(latest_features_b.dot(theta)[0])
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

        # ─── Alpha Suite Intelligence ─────────────────────────────────────────
        
        # 1. Structure Liquidity (Sweep & Reclaim)
        liq_setup = check_structure_liquidity(df)
        if liq_setup:
            for s in liq_setup['signals']:
                signals.append(s)
            score += liq_setup['score']

        # 2. Wyckoff Spring
        wyckoff_setup = check_wyckoff_spring(df)
        if wyckoff_setup:
            for s in wyckoff_setup['signals']:
                signals.append(s)
            score += wyckoff_setup['score']
            
        is_profitable = profit_margin > 0
        if is_profitable:
            signals.append(f"Profitable ({profit_margin * 100:.1f}%)")
            score += 3

        price = float(latest["Close"])
        prev_close = float(df.iloc[-2]["Close"])
        change_pct = ((price - prev_close) / prev_close) * 100
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
            "changePct": round(change_pct, 2),
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
    finally:
        # Help GC by del ref
        try:
             del df, stock
        except: pass


def analyze_single_penny(ticker: str) -> Optional[dict]:
    """Analyze a single penny stock in depth."""
    return _deep_analyze(ticker, _market_progress())
