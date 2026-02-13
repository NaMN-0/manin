import yfinance as yf
import pandas as pd
from typing import List, Dict
from services.market_service import get_market_overview
from services.penny_service import get_basic_penny_list
from services.cache_service import CacheService

# Simple Financial Sentiment Lexicon
BULLISH_WORDS = {
    'upgrade', 'buy', 'outperform', 'growth', 'gain', 'surpass', 'profit', 'beat',
    'bullish', 'breakout', 'record', 'high', 'surge', 'rally', 'momentum', 'strong',
    'opportunity', 'expansion', 'optimistic', 'positive', 'win', 'success'
}

BEARISH_WORDS = {
    'downgrade', 'sell', 'underperform', 'loss', 'drop', 'miss', 'decline', 'bearish',
    'breakdown', 'crash', 'low', 'slump', 'plunge', 'weak', 'risk', 'negative',
    'pessimistic', 'fail', 'warning', 'concern', 'debt', 'cut'
}

class NewsService:
    @staticmethod
    def analyze_tickers(tickers: List[str]) -> List[Dict]:
        """Analyze a specific list of tickers for news sentiment."""
        results = []
        # Limit to 10 tickers per batch to prevent timeouts/rate limits if called directly
        # For larger lists, the caller should handle batching or we loop here.
        # We'll process all provided, assuming the controller limits the input size.
        
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                news = stock.news[:5] # Top 5 news items
                
                sentiment_score = 0
                summaries = []
                
                for item in news:
                    # yfinance structure changed: title is often in item['content']['title']
                    content = item.get('content', {})
                    title = content.get('title') or item.get('title', '')
                    title = title.lower()
                    
                    # Basic sentiment count
                    bull_hits = sum(1 for w in BULLISH_WORDS if w in title)
                    bear_hits = sum(1 for w in BEARISH_WORDS if w in title)
                    
                    sentiment_score += (bull_hits - bear_hits)
                    summaries.append(content.get('title') or item.get('title', ''))

                if not news:
                    # Even if no news, we return the ticker with neutral status so UI knows it was processed
                    # Or we can skip. Let's return with neutral to show "No News" state.
                    pass

                # Normalization and categorization
                sentiment_label = "Neutral"
                if sentiment_score > 1: sentiment_label = "Bullish"
                elif sentiment_score < -1: sentiment_label = "Bearish"
                
                # Fetch basic price data for context
                try:
                    price_info = stock.history(period="1d")
                    price = round(price_info['Close'].iloc[-1], 2) if not price_info.empty else 0
                    change_pct = round(((price_info['Close'].iloc[-1] - price_info['Open'].iloc[-1]) / price_info['Open'].iloc[-1]) * 100, 2) if not price_info.empty else 0
                except:
                    price = 0
                    change_pct = 0

                results.append({
                    "ticker": ticker,
                    "price": price,
                    "changePct": change_pct,
                    "sentimentScore": sentiment_score,
                    "sentiment": sentiment_label,
                    "newsCount": len(news),
                    "headline": summaries[0] if summaries else "No recent headlines",
                    "outlook": NewsService._generate_outlook(sentiment_score, ticker)
                })

            except Exception as e:
                print(f"News Analysis Error for {ticker}: {e}")
                continue
        
        # Sort by sentiment magnitude
        results.sort(key=lambda x: (abs(x['sentimentScore']), x['sentimentScore']), reverse=True)
        return results

    @staticmethod
    def get_ai_intelligence() -> List[Dict]:
        """Aggregate hot stocks, fetch news, and rate sentiment. Top 10 only."""
        
        # Try cache first (1 hour TTL)
        cached = CacheService.get("news_intelligence", max_age_minutes=60)
        if cached:
            return cached

        # 1. Gather "Hot" tickers
        hot_tickers = set()
        
        # From Market Overview (Movers)
        overview = get_market_overview()
        for mover in overview.get('topMovers', []):
            hot_tickers.add(mover['ticker'])
            
        # From Penny Stocks (High Volume)
        penny_movers = get_basic_penny_list(limit=20)
        for pm in penny_movers:
            hot_tickers.add(pm['ticker'])
            
        # Limited list for deep analysis (protecting rate limits)
        candidates = list(hot_tickers)[:15]
        
        # Use simple batched analysis
        results = NewsService.analyze_tickers(candidates)
        
        top_10 = results[:10]
        
        # Cache results
        CacheService.set("news_intelligence", top_10)
        
        return top_10

    @staticmethod
    def _generate_outlook(score: int, ticker: str) -> str:
        if score > 2:
            return f"{ticker} is seeing strong positive news flow. Momentum likely to persist for 3-5 days."
        elif score > 0:
            return f"Moderate bullish sentiment for {ticker}. Watch for volume confirmation."
        elif score < -2:
            return f"Warning: Heavy negative news pressure on {ticker}. Short-term downside risk is high."
        elif score < 0:
            return f"{ticker} facing some headwinds. News tone is cautious."
        else:
            return f"Neutral news cycle for {ticker}. Price action will likely follow technical levels."
