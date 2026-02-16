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
from datetime import datetime
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# New Signals Module
from services.signals import check_structure_liquidity, check_wyckoff_spring, detect_momentum_velocity

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


import math

def _check_nan(val):
    """Converts NaN/Inf to None/0 for JSON safety."""
    if val is None: return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return 0.0
        return f
    except:
        return 0.0

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
    cached = CacheService.get("penny_universe_v2", max_age_minutes=1440)
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
            
            CacheService.set("penny_universe_v2", sanitized)
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

    # Phase 2: Deep analysis (Optimized for Render Free Tier: Batch + Parallel Info)
    market_prog = _market_progress()
    results = []

    # Process targets in chunks of 50
    # We fetch history for 50 tickers at once, and info in parallel
    analysis_chunk_size = 50 
    
    import pandas as pd
    import yfinance as yf

    for i in range(0, len(targets), analysis_chunk_size):
        chunk_targets = targets[i : i + analysis_chunk_size]
        
        # 1. Batch History Download
        try:
            # period="6mo" for technicals
            batch_data = yf.download(chunk_targets, period="6mo", group_by="ticker", threads=True, progress=False, timeout=20)
        except Exception as e:
            logger.error(f"Batch history download failed: {e}")
            batch_data = None

        # 2. Parallel Info Fetching
        # We use ThreadPoolExecutor to fetch .info concurrently
        chunk_infos = {}
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_ticker = {executor.submit(lambda t: yf.Ticker(t).info, t): t for t in chunk_targets}
            for future in as_completed(future_to_ticker):
                t = future_to_ticker[future]
                try:
                    chunk_infos[t] = future.result()
                except Exception:
                    chunk_infos[t] = {}

        # 3. Analyze
        for ticker in chunk_targets:
            # Extract specific DF
            ticker_df = None
            if batch_data is not None and not batch_data.empty:
                try:
                    if len(chunk_targets) == 1:
                        ticker_df = batch_data
                    elif ticker in batch_data.columns.levels[0]:
                        ticker_df = batch_data[ticker]
                except Exception:
                    pass

            res = _deep_analyze(ticker, market_prog, pre_df=ticker_df, pre_info=chunk_infos.get(ticker))
            if res:
                results.append(res)
                if len(results) >= limit:
                    break
        
        # Explicit GC
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

    # Phase 2: Deep Analyze the filtered list (Optimized)
    market_prog = _market_progress()
    results = []
    
    if filtered_batch:
        import yfinance as yf
        # 1. Batch History
        try:
             batch_data = yf.download(filtered_batch, period="6mo", group_by="ticker", threads=True, progress=False, timeout=15)
        except Exception:
             batch_data = None
        
        # 2. Parallel Info
        chunk_infos = {}
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_ticker = {executor.submit(lambda t: yf.Ticker(t).info, t): t for t in filtered_batch}
            for future in as_completed(future_to_ticker):
                t = future_to_ticker[future]
                try:
                    chunk_infos[t] = future.result()
                except Exception:
                    chunk_infos[t] = {}

        # 3. Analyze
        for ticker in filtered_batch:
            # Extract specific DF
            ticker_df = None
            if batch_data is not None and not batch_data.empty:
                try:
                    if len(filtered_batch) == 1:
                        ticker_df = batch_data
                    elif ticker in batch_data.columns.levels[0]:
                        ticker_df = batch_data[ticker]
                except Exception:
                    pass
            
            res = _deep_analyze(ticker, market_prog, pre_df=ticker_df, pre_info=chunk_infos.get(ticker))
            if res:
                results.append(res)

    # Save to Cache
    if results:
        CacheService.set(cache_key, results)

    return results


def _deep_analyze(ticker: str, market_progress: float = 1.0, is_pro: bool = False, pre_df=None, pre_info=None) -> Optional[dict]:
    """Deep analysis on a single penny stock. Supports pre-fetched data for performance."""
    from services.news_service import NewsService
    try:
        import pandas_ta_classic as ta
        import yfinance as yf
        import pandas as pd
        import numpy as np

        stock = yf.Ticker(ticker)
        
        if pre_df is not None and not pre_df.empty:
            df = pre_df
        else:
            df = stock.history(period="6mo")
            
        if df.empty or len(df) < 30:
            return None

        # Flatten columns
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Profit margin
        try:
            if pre_info:
                info = pre_info
            else:
                info = stock.info
            
            profit_margin = _check_nan(info.get("profitMargins", 0))
            market_cap = _check_nan(info.get("marketCap", 0))
            trailing_pe = _check_nan(info.get("trailingPE", 0))
            sector = info.get("sector", "Unknown")
            industry = info.get("industry", "Unknown")
            high_52 = _check_nan(info.get("fiftyTwoWeekHigh", 0))
            low_52 = _check_nan(info.get("fiftyTwoWeekLow", 0))
            float_shares = _check_nan(info.get("floatShares", 0))
        except Exception:
            profit_margin = 0.0
            market_cap = 0.0
            trailing_pe = 0.0
            sector = "Unknown"
            industry = "Unknown"
            high_52 = 0.0
            low_52 = 0.0
            float_shares = 0.0

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
            
        # 3. Momentum Velocity (Rocket Signals)
        velocity_setup = detect_momentum_velocity(df)
        if velocity_setup:
            for s in velocity_setup['signals']:
                signals.append(s)
            score += velocity_setup['score']
            
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

        # ─── Professional Reasoning (Financial Analysis) ──────────────────────
        
        reasoning = []
        
        # 1. Opening Assessment (Based on Score)
        if score >= 8:
            reasoning.append("Strong technical setup with high-probability bullish convergence.")
        elif score >= 5:
            reasoning.append("Moderate potential identified; monitoring for confirmation signals.")
        else:
            reasoning.append("Current setup lacks clarity; caution advised until trend resolves.")

        # 2. Volume Logic
        if vol_ratio > 3.0:
            reasoning.append(f"Institutional-grade accumulation detected ({vol_ratio:.1f}x avg volume).")
        elif vol_ratio > 1.5:
            reasoning.append(f"Notable volume increase ({vol_ratio:.1f}x), suggesting rising interest.")

        # 3. Upside & Valuation
        if upside > 30:
            reasoning.append(f"Deep value deviation suggests significant upside potential of ~{upside:.0f}%.")
        elif upside > 10:
            reasoning.append(f"Price objective implies {upside:.0f}% upside from current levels.")

        # 4. Profitability / Health
        if is_profitable:
            reasoning.append(f"Company is profitable ({profit_margin * 100:.1f}% margin), providing fundamental support.")
        
        # 5. Technical Setups (Alpha Suite)
        if liq_setup:
            reasoning.append("Liquidity sweep detected; potential for rapid mean reversion.")
        if wyckoff_setup:
            reasoning.append("Wyckoff 'Spring' pattern identified, indicating potential trend reversal.")
        
        # New Velocity Reasoning
        if velocity_setup:
            v_metrics = velocity_setup.get('velocity_metrics', {})
            roc_3d = v_metrics.get('roc_3d', 0)
            if "Vertical Move" in str(velocity_setup['signals']):
                reasoning.append(f"Parabolic price action detected ({roc_3d:.0f}% 3-day ROC).")
            elif "Parabolic Acceleration" in str(velocity_setup['signals']):
                reasoning.append("Accelerated momentum profile suggests aggressive buying pressure.")
            else:
                reasoning.append(f"Strong momentum building ({roc_3d:.1f}% ROC).")

        if latest["Close"] > latest.get("SMA_20", 0) and latest["Close"] > latest.get("SMA_50", 0):
            reasoning.append("Price has reclaimed key moving averages (SMA 20/50).")

        # 6. RSI Logic
        rsi_val = latest.get("RSI_14", 50)
        if rsi_val > 70:
            reasoning.append("RSI indicates overbought conditions; anticipate consolidation.")
        elif rsi_val < 35:
            reasoning.append("RSI indicates oversold conditions; potential for relief bounce.")

        # Pro-only insights
        news_data = None
        if is_pro:
            try:
                # Add News Sentiment
                news_results = NewsService.analyze_tickers([ticker])
                if news_results:
                    news_data = news_results[0]
                    sentiment_desc = news_data.get('sentiment', 'Neutral')
                    reasoning.append(f"News sentiment is currently {sentiment_desc}. {news_data.get('outlook', '')}")
            except Exception as e:
                logger.warning(f"Failed to fetch pro news for {ticker}: {e}")
        else:
            if len(reasoning) > 2:
                # Keep it concise for non-pro, but professional.
                reasoning = reasoning[:2]
                reasoning.append("Detailed analysis reserved for Pro members.")

        reason = " ".join(reasoning)

        return {
            "ticker": ticker,
            "price": _check_nan(round(price, 4)),
            "predicted": _check_nan(round(predicted_price, 4)),
            "changePct": _check_nan(round(change_pct, 2)),
            "upside": _check_nan(round(upside, 1)),
            "margin": _check_nan(round(profit_margin * 100, 1)),
            "isProfitable": is_profitable,
            "score": score,
            "signals": signals,
            "reasoning": reason,
            "newsSentiment": news_data if is_pro else None,
            "isProInsight": is_pro,
            "volume": int(current_vol) if current_vol > 0 else 0,
            "projVolume": int(projected_vol) if projected_vol > 0 else 0,
            "priceHistory": price_history,
            "marketCap": _check_nan(market_cap),
            "pe": _check_nan(trailing_pe),
            "sector": sector,
            "industry": industry,
            "yearHigh": _check_nan(high_52),
            "yearLow": _check_nan(low_52),
            "float": _check_nan(float_shares),
        }
    except Exception:
        traceback.print_exc()
        return None
    finally:
        # Help GC by del ref
        try:
             del df, stock
        except: pass


def analyze_single_penny(ticker: str, is_pro: bool = False) -> Optional[dict]:
    """Analyze a single penny stock in depth."""
    return _deep_analyze(ticker, _market_progress(), is_pro=is_pro)
