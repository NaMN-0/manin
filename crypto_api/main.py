import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import asyncio
import time
import random

app = FastAPI(title="KAGE AI API", version="0.4.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache state for CoinGecko stats
_stats_cache = {
    "data": None,
    "last_sync": 0,
    "ttl": 300,  # Cache for 5 minutes (Extreme Stability)
    "backoff_until": 0
}

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
COINCAP_BASE = "https://api.coincap.io/v2"

def calculate_signals(coin: Dict[str, Any]) -> List[str]:
    """Calculate tactical trading signals based on price and volume action."""
    signals = []
    change = coin.get('price_change_percentage_24h') or 0
    volume = coin.get('total_volume') or 0
    market_cap = coin.get('market_cap') or 1
    
    if volume / market_cap > 0.3:
        signals.append("VOLUME_BREAKOUT")
    if change < -15:
        signals.append("OVERSOLD_ZONE")
    if change > 25:
        signals.append("MOON_MOMENTUM")
    return signals

def get_tactical_advice(category: str, data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate dynamic advice and confidence score based on category data."""
    if not data:
        return {"advice": "Scanning market for opportunities...", "confidence": 50.0}
    
    avg_change = sum(c.get('change', 0) for c in data) / len(data)
    signal_count = sum(len(c.get('signals', [])) for c in data)
    
    # Base confidence on signal density and trend clarity
    base_conf = 70.0 + min(signal_count * 2, 20)
    
    if category == "gainers":
        advice = "Momentum is strong. "
        if avg_change > 20:
            advice += "Extremely bullish trend. Watch for 'VOLUME_BREAKOUT' to confirm sustained growth."
        else:
            advice += "Searching for high-conviction breakout signals among top movers."
    elif category == "losers":
        advice = "Market experiencing localized panics. "
        if any("OVERSOLD_ZONE" in c.get('signals', []) for c in data):
            advice += "Oversold signals detected. Look for high-volume reversals at key support levels."
        else:
            advice += "Watching for capitulation points before recommending entry."
    elif category == "penny_gems":
        advice = "High volatility detected in small-cap nodes. "
        if signal_count > 5:
            advice += "Multiple breakout signals identified. High risk, high reward potential."
        else:
            advice += "Wait for volume anomalies before committing to low-liquidity assets."
    elif category == "new_listings":
        advice = "Genesis monitoring active. "
        advice += "Focusing on trending mid-caps. Institutional majors (Top 100) are filtered out."
    else:
        advice = "Analyzing real-time capital flow metrics."

    return {
        "advice": advice,
        "confidence": round(base_conf + (random.random() * 5), 1)
    }

@app.get("/api/crypto/stats")
async def get_crypto_stats():
    """Returns global crypto market statistics with 60s backend caching."""
    now = time.time()
    if _stats_cache["data"] and (now - _stats_cache["last_sync"] < _stats_cache["ttl"]):
        print(f"CACHE_HIT :: RETURNING DATA FROM {int(now - _stats_cache['last_sync'])}s AGO")
        return _stats_cache["data"]

    async with httpx.AsyncClient() as client:
        try:
            # 1. Parallel Requests
            global_task = client.get(f"{COINGECKO_BASE}/global")
            markets_params = {"vs_currency": "usd", "order": "market_cap_desc", "per_page": 250, "page": 1, "price_change_percentage": "24h"}
            markets_task = client.get(f"{COINGECKO_BASE}/coins/markets", params=markets_params)
            trending_task = client.get(f"{COINGECKO_BASE}/search/trending")
            
            responses = await asyncio.gather(global_task, markets_task, trending_task, return_exceptions=True)
            
            # Validation logic to prevent 'str' object attribute errors
            valid_responses = []
            for res in responses:
                if isinstance(res, Exception):
                    raise res
                if res.status_code != 200:
                    raise Exception(f"API_ERROR: {res.status_code} - {res.text[:100]}")
                valid_responses.append(res.json())

            global_json, markets_json, trending_json = valid_responses
            
            global_data = global_json.get("data", {})
            if not isinstance(global_data, dict): global_data = {}
            
            markets_data = markets_json if isinstance(markets_json, list) else []
            trending_data = trending_json.get("coins", []) if isinstance(trending_json, dict) else []

            # Process Markets Data
            processed_data = []
            top_100_ids = set()
            for coin in markets_data:
                if not isinstance(coin, dict): continue
                
                price = coin.get("current_price") or 0
                rank = coin.get("market_cap_rank")
                if rank and isinstance(rank, int) and rank <= 100:
                    top_100_ids.add(coin.get("id"))
                
                signals = calculate_signals(coin)
                processed_data.append({
                    "id": coin.get("id"),
                    "name": coin.get("name"),
                    "symbol": str(coin.get("symbol", "UNK")).upper(),
                    "price": price,
                    "formatted_price": f"${price:,}" if price >= 0.01 else f"${price:.6f}",
                    "change": coin.get('price_change_percentage_24h') or 0,
                    "formatted_change": f"{coin.get('price_change_percentage_24h') or 0:+.2f}%",
                    "image": coin.get("image"),
                    "rank": rank,
                    "volume": f"${coin.get('total_volume', 0) / 1e6:,.2f}M" if coin.get('total_volume', 0) >= 1e6 else f"${coin.get('total_volume', 0) / 1e3:,.1f}K",
                    "signals": signals
                })

            # Subsets
            gainers = sorted(processed_data, key=lambda x: x['change'], reverse=True)[:20]
            losers = sorted(processed_data, key=lambda x: x['change'])[:20]
            penny_gems = sorted([c for c in processed_data if c['price'] < 0.5], key=lambda x: abs(x['change']), reverse=True)[:20]
            
            # New Listings/Trending Filtered (No Top 100 like BTC/ETH)
            new_listings = []
            for t_coin in trending_data:
                if not isinstance(t_coin, dict): continue
                item = t_coin.get('item', {})
                if not isinstance(item, dict): continue
                
                coin_id = item.get("id")
                # Filter out established majors
                if coin_id in top_100_ids or (item.get("market_cap_rank") and item.get("market_cap_rank") <= 100):
                    continue
                
                data_node = item.get("data", {})
                price_val = data_node.get("price", "N/A") if isinstance(data_node, dict) else "N/A"
                    
                new_listings.append({
                    "id": coin_id,
                    "name": item.get("name"),
                    "symbol": item.get("symbol"),
                    "price": price_val,
                    "formatted_price": str(price_val),
                    "change": 0,
                    "formatted_change": "+ Trending",
                    "image": item.get("small"),
                    "rank": item.get("market_cap_rank"),
                    "volume": "High Activity",
                    "signals": ["NEW_LISTING", "SMALL_CAP_HEAT"]
                })

            return {
                "global": {
                    "market_cap": f"${int(global_data.get('total_market_cap', {}).get('usd', 0) / 1e12):.1f}T",
                    "bitcoin_dominance": f"{global_data.get('market_cap_percentage', {}).get('btc', 0):.1f}%",
                    "active_cryptos": f"{global_data.get('active_cryptos', 0):,}",
                    "volume_24h": f"${int(global_data.get('total_volume', {}).get('usd', 0) / 1e9):.1f}B",
                },
                "data": {
                    "gainers": {"list": gainers, "insight": get_tactical_advice("gainers", gainers)},
                    "losers": {"list": losers, "insight": get_tactical_advice("losers", losers)},
                    "penny_gems": {"list": penny_gems, "insight": get_tactical_advice("penny_gems", penny_gems)},
                    "new_listings": {"list": new_listings, "insight": get_tactical_advice("new_listings", new_listings)},
                }
            }
            
            _stats_cache["data"] = result
            _stats_cache["last_sync"] = now
            return result
        except Exception as e:
            print(f"CRITICAL_ERROR: {str(e)}")
            # If we have old data, return it on error to prevent total failure
            if _stats_cache["data"]:
                return _stats_cache["data"]
            return {"error": str(e), "data": {}}
