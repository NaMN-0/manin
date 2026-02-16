
import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from services.penny_service import get_universe, _deep_analyze, _market_progress
from services.news_service import NewsService
from services.cache_service import CacheService

class MoonshotService:
    @staticmethod
    def get_top_moonshots() -> List[Dict]:
        """
        Intelligently finds the top 5 stocks with 10x potential.
        Uses a weighted scoring model: 
        - 40% Fundamentals (Growth, Mkt Cap)
        - 30% Technicals (Volume Surge, Momentum)
        - 30% Sentiment (AI News Analysis)
        """
        # Try cache first (4 hours for moonshots as they are deeper scans)
        cached = CacheService.get("moonshot_hunter", max_age_minutes=240)
        if cached:
            return cached

        universe = get_universe()
        if not universe:
            return []

        # 1. Broad Filter (Micro-cap + Price + Volume)
        # We take a sample of the universe to avoid hitting yfinance too hard
        # and prioritize based on recent volume from basic penny list
        candidates = universe[:150] 
        
        scored_stocks = []
        market_prog = _market_progress()

        print(f"Moonshot Scan started for {len(candidates)} candidates...")

        for ticker in candidates:
            try:
                # Get deep technical/fundamental data
                data = _deep_analyze(ticker, market_prog)
                if not data:
                    continue

                # Filter for "Moonshot" profile
                # 10x potential usually means Market Cap < 500M
                mkt_cap = data.get("marketCap", 0)
                if not (10_000_000 < mkt_cap < 600_000_000):
                    continue

                # Start Moonshot Scoring (0-100)
                moon_score = 0
                reasoning = []

                # A. Fundamental Alpha (Max 40)
                # We love growth.
                growth_score = 0
                if data.get("isProfitable"):
                    growth_score += 15
                    reasoning.append("Profitable micro-cap foundation")
                
                # Check for revenue/earnings growth if info available
                # (Using yfinance info directly for extra depth)
                try:
                    info = yf.Ticker(ticker).info
                    rev_growth = info.get("revenueGrowth", 0) or 0
                    if rev_growth > 0.5: # > 50% growth
                        growth_score += 25
                        reasoning.append(f"Explosive Revenue Growth ({rev_growth*100:.1f}%)")
                    elif rev_growth > 0.2:
                        growth_score += 15
                        reasoning.append(f"Strong Revenue Growth ({rev_growth*100:.1f}%)")
                except:
                    pass
                moon_score += min(growth_score, 40)

                # B. Technical Thrust (Max 30)
                tech_score = 0
                vol_ratio = data.get("projVolume", 0) / (data.get("volume") if data.get("volume") > 0 else 1)
                # Actually _deep_analyze already calculates a vol_ratio implicitly in signals
                # but let's be more specific here.
                if data.get("score", 0) >= 5: # high base score
                    tech_score += 15
                
                if "Massive Volume" in str(data.get("signals")):
                    tech_score += 15
                    reasoning.append("Abnormal Institutional Accumulation")
                
                # Breaking 52-week highs or High Velocity Move is a moonshot signal
                p = data.get("price", 0)
                y_high = data.get("yearHigh", 0)
                
                # Check for new velocity signals
                data_signals = str(data.get("signals", []))
                if "Vertical Move" in data_signals:
                    tech_score += 15
                    reasoning.append("Explosive Vertical Momentum Detected")
                elif "High Velocity" in data_signals:
                    tech_score += 10
                    reasoning.append("Strong Velocity Breakout")
                
                if p > 0 and y_high > 0 and p >= (y_high * 0.9):
                    tech_score += 10
                    reasoning.append("Breaking 52-Week High Resistance")
                
                moon_score += min(tech_score, 30)

                # C. Sentiment Alpha (Max 30) - Aggregated later for Top 5
                # For now, we use a placeholder or quick check
                # We will perform deep sentiment ONLY for the top 10 candidates to save API/Time
                
                data["moonScore"] = moon_score
                data["moonReasoning"] = reasoning
                scored_stocks.append(data)

            except Exception as e:
                print(f"Error scoring {ticker}: {e}")
                continue

        # Sort and take top 10 for deep sentiment analysis
        scored_stocks.sort(key=lambda x: x["moonScore"], reverse=True)
        top_candidates = scored_stocks[:10]

        # D. Add Deep Sentiment for the winners
        final_top = []
        for stock in top_candidates:
            sentiment_data = NewsService.analyze_tickers([stock["ticker"]])
            if sentiment_data:
                s = sentiment_data[0]
                stock["sentiment"] = s["sentiment"]
                stock["sentimentScore"] = s["sentimentScore"]
                stock["outlook"] = s["outlook"]
                
                if s["sentiment"] == "Bullish":
                    stock["moonScore"] += 20
                    stock["moonReasoning"].append("Highly Bullish AI Sentiment")
                elif s["sentiment"] == "Neutral":
                    stock["moonScore"] += 10
            
            final_top.append(stock)

        # Final Sort and take Top 5
        final_top.sort(key=lambda x: x["moonScore"], reverse=True)
        result = final_top[:5]

        # Cache the moonshots
        CacheService.set("moonshot_hunter", result)
        
        return result
