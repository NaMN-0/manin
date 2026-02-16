"""
Market analysis service — wraps existing market_loader.py and market_server.py logic.
"""

import warnings
import traceback
from functools import lru_cache
from typing import Optional

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
import math

def check_nan(val):
    """Converts NaN/Inf to None for JSON safety."""
    if val is None: return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except:
        return None

def generate_market_commentary(indices_data, top_movers, market_open) -> str:
    """Generates AI-style commentary based on market state."""
    if not indices_data:
        return "The battlefield is quiet. Sensei is observing the shadows for signs of movement."
    
    # Simple logic to determine sentiment
    bullish_indices = [idx for idx in indices_data if idx.get('changePct', 0) > 0]
    is_bullish = len(bullish_indices) > len(indices_data) / 2
    
    avg_change = sum([idx.get('changePct', 0) for idx in indices_data]) / len(indices_data)
    
    if not market_open:
        msg = "The markets have retreated to their camps. "
        if is_bullish:
            msg += f"The last session showed strength with an average gain of {avg_change:.2f}%. Bulls hold the high ground."
        else:
            msg += f"Recent combat saw the bears pushing back. Average retreat: {abs(avg_change):.2f}%. Prepare for the next bell."
        return msg

    # Market Open logic
    if is_bullish:
        if avg_change > 1.5:
            return f"A powerful surge! Markets are charging forward by {avg_change:.2f}%. Strikes are landing with precision today."
        return f"Steady momentum. The green banners are flying high across the indices ({avg_change:.2f}% avg)."
    else:
        if avg_change < -1.5:
            return f"Hostile forces in control. A significant retreat of {abs(avg_change):.2f}% detected. Exercise extreme caution, Ninja."
        return f"Consolidation in progress. Minor volatility ({avg_change:.2f}%) as the bulls and bears engage in tactical skirmishes."

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
            import yfinance as yf
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
                    "price": check_nan(round(current, 2)),
                    "change": check_nan(round(change, 2)),
                    "changePct": check_nan(round(change_pct, 2)),
                }
            )
        except Exception:
            continue

    # Top movers from a quick scan of popular tickers
    top_movers = _get_top_movers()
    
    commentary = generate_market_commentary(indices_data, top_movers, _is_market_open())
    
    result = {
        "indices": indices_data, 
        "topMovers": top_movers, 
        "marketOpen": _is_market_open(),
        "commentary": commentary
    }
    
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
        import yfinance as yf
        data = yf.download(watchlist, period="5d", group_by="ticker", threads=False, progress=False)
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
                        "price": check_nan(round(current, 2)),
                        "changePct": check_nan(round(change_pct, 2)),
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
        import yfinance as yf
        import pandas as pd

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

        # Fundamentals
        try:
            t_obj = yf.Ticker(ticker)
            info = t_obj.info
            market_cap = info.get("marketCap")
            pe_ratio = info.get("trailingPE")
            year_high = info.get("fiftyTwoWeekHigh")
            year_low = info.get("fiftyTwoWeekLow")
            short_name = info.get("shortName", ticker)
            sector = info.get("sector", "Unknown")
            beta = info.get("beta")
        except Exception:
            market_cap, pe_ratio, year_high, year_low, short_name, sector, beta = None, None, None, None, ticker, "Unknown", None

        # Predicted price (Placeholder simulation logic based on score)
        # Real logic would use ML model
        predicted_price = float(latest["Close"]) * (1 + (score * 0.02)) if score > 0 else float(latest["Close"])

        return {
            "ticker": ticker,
            "companyName": short_name,
            "sector": sector,
            "price": check_nan(round(float(latest["Close"]), 2)),
            "changePct": check_nan(round(change_pct, 2)),
            "volume": check_nan(float(latest["Volume"])),
            "marketCap": check_nan(market_cap),
            "pe": check_nan(pe_ratio),
            "yearHigh": check_nan(year_high),
            "yearLow": check_nan(year_low),
            "beta": check_nan(beta),
            "predicted": check_nan(round(predicted_price, 2)),
            "score": score,
            "verdict": verdict,
            "reasoning": f"Asset {ticker} showing {verdict} signals. RSI: {rsi_val:.1f}. Trend is {'Bullish' if trend else 'Bearish'}.",
            "rsi": check_nan(round(rsi_val, 1)),
            "signals": signals,
            "priceHistory": price_history,
        }
    except Exception as e:
        traceback.print_exc()
        return None

# ─── Sector Insights ──────────────────────────────────────────────────

def get_sector_accuracy(filter_val: str, filter_type: str = "letter", universe_type="penny") -> dict:
    """
    Calculates the 'Sensei Success Rate' for a given sector/letter.
    Based on historical returns (last 7 days) of a sample of stocks.
    """
    cache_key = f"accuracy_{universe_type}_{filter_type}_{filter_val.upper()}"
    cached = CacheService.get(cache_key, max_age_minutes=60)
    if cached:
        return cached

    tickers = []
    if universe_type == "penny":
        try:
            import penny_loader
            if filter_type == "sector":
                # Get all tickers and filter by sector
                all_penny = penny_loader.get_penny_stocks(max_price=5.0)
                metadata = penny_loader.get_ticker_metadata()
                tickers = [t for t in all_penny if metadata.get(t, {}).get('sector') == filter_val]
            else:
                all_penny = penny_loader.get_penny_stocks(max_price=5.0)
                tickers = [t for t in all_penny if t.startswith(filter_val.upper())]
        except ImportError:
            pass
    
    if not tickers:
        return {"accuracy": 0, "win_rate": 0, "sample_size": 0}

    # Take a sample for performance
    import random
    sample = random.sample(tickers, min(len(tickers), 15))
    
    win_count = 0
    try:
        import yfinance as yf
        data = yf.download(sample, period="7d", interval="1d", progress=False, group_by='ticker')
        
        for t in sample:
            try:
                df = data[t] if len(sample) > 1 else data
                if df.empty or len(df) < 5: continue
                
                # Check 7 day return
                start_price = float(df['Close'].iloc[0])
                end_price = float(df['Close'].iloc[-1])
                if end_price > start_price:
                    win_count += 1
            except: continue
    except:
        pass

    accuracy = (win_count / len(sample)) * 100 if sample else 0
    result = {
        "accuracy": round(accuracy, 1),
        "win_rate": round(accuracy, 1),
        "sample_size": len(sample),
        "period": "7 days"
    }
    
    CacheService.set(cache_key, result)
    return result

def get_smart_batch(letter: Optional[str] = None, sector: Optional[str] = None, universe_type="penny", strategy="momentum") -> dict:
    """
    Optimized Smart Discovery: Consolidated scans and reduced scope for Production stability.
    """
    import yfinance as yf
    import pandas as pd
    import random
    
    candidates = []
    accuracy_data = {"accuracy": 0}
    filter_val = letter if letter else sector
    filter_type = "letter" if letter else "sector"
    
    if not filter_val:
        return {"candidates": [], "top_picks": [], "accuracy_data": accuracy_data}

    # 1. Get Tickers (Reduced Scope for Render)
    tickers = []
    if universe_type == "penny":
        try:
            import penny_loader
            all_penny = penny_loader.get_penny_stocks(max_price=5.0) 
            if sector:
                metadata = penny_loader.get_ticker_metadata()
                tickers = [t for t in all_penny if metadata.get(t, {}).get('sector') == sector]
            elif letter:
                tickers = [t for t in all_penny if t.startswith(letter.upper())]
        except Exception:
            tickers = []
    
    if not tickers:
        return {
            "letter": filter_val,
            "filter_val": filter_val,
            "filter_type": filter_type,
            "candidates": [], 
            "top_picks": [], 
            "accuracy_data": accuracy_data
        }
    
    # Take up to 50 tickers to ensure we finish within timeout
    target_tickers = tickers[:50]
    
    # 2. Get Accuracy Data (Cached)
    accuracy_data = get_sector_accuracy(filter_val, filter_type, universe_type)
    
    # 3. Optimized Consolidated Scan
    if strategy == "momentum":
        try:
            # Single large batch download with explicit period
            # Period 15d is enough for 10-day SMA and 5-day move checks
            batch_data = yf.download(target_tickers, period="15d", group_by='ticker', threads=True, progress=False, timeout=10)
            
            for ticker in target_tickers:
                try:
                    df = batch_data[ticker] if len(target_tickers) > 1 else batch_data
                    if df.empty or len(df) < 5: continue
                    
                    latest = df.iloc[-1]
                    prev = df.iloc[-2]
                    price = float(latest['Close'])
                    if price <= 0: continue
                    
                    change_pct = ((price - float(prev['Close'])) / float(prev['Close'])) * 100
                    
                    # consolidated check (from scan_volatility_setup)
                    # 1. Volatility check
                    max_gain_5d = df['Close'].pct_change().tail(5).max()
                    if max_gain_5d < 0.04: continue # Slightly less strict
                    
                    # 2. Consolidation check
                    high_5d = df['High'].tail(5).max()
                    if price < (high_5d * 0.80): continue # 20% pullback allowed for pennies
                    
                    # 3. Scoring
                    score = 2
                    signals = []
                    
                    # Simple SMA-10 for momentum
                    sma_10 = df['Close'].rolling(window=10).mean().iloc[-1]
                    if price > sma_10:
                        score += 1
                        signals.append("Bullish Trend")
                    
                    if change_pct > 2:
                        score += 1
                        signals.append("Active Momentum")
                    
                    # Relative Volume Estimate
                    avg_vol = df['Volume'].tail(10).mean()
                    if avg_vol > 0 and latest['Volume'] > (avg_vol * 1.2):
                        score += 1
                        signals.append("Volume Spiking")

                    candidates.append({
                        "ticker": ticker,
                        "price": check_nan(round(price, 3)),
                        "changePct": check_nan(round(change_pct, 2)),
                        "score": score,
                        "signals": signals[:1],
                        "verdict": "BULLISH" if score >= 4 else "NEUTRAL"
                    })
                except: continue
        except Exception as e:
            print(f"Scan optimization error: {e}")

    # 4. Sorting & Curation
    if candidates:
        candidates.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    top_picks = candidates[:3]
    
    return {
        "letter": filter_val,
        "filter_val": filter_val,
        "filter_type": filter_type,
        "count": len(candidates),
        "candidates": candidates,
        "top_picks": top_picks,
        "accuracy_data": accuracy_data
    }
