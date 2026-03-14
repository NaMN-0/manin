import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import asyncio
import time
import random

app = FastAPI(title="KAGE AI API", version="0.4.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache state for Resilience
_stats_cache = {
    "data": None,
    "last_sync": 0,
    "ttl": 300,  # 5 Minute Mastery
    "backoff_until": 0
}

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
COINCAP_BASE = "https://api.coincap.io/v2"
COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1"

def calculate_signals(coin: Dict[str, Any]) -> List[str]:
    signals = []
    change = coin.get('price_change_percentage_24h') or 0
    volume = coin.get('total_volume') or 0
    market_cap = coin.get('market_cap') or 1
    if volume / market_cap > 0.3: signals.append("VOLUME_BREAKOUT")
    if change < -15: signals.append("OVERSOLD_ZONE")
    if change > 25: signals.append("MOON_MOMENTUM")
    return signals

def get_tactical_advice(category: str, data: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not data: return {"advice": "Reconnaissance in progress...", "confidence": 50.0}
    avg_change = sum(c.get('change', 0) for c in data) / len(data)
    signal_count = sum(len(c.get('signals', [])) for c in data)
    base_conf = 70.0 + min(signal_count * 2, 20)
    
    advices = {
        "gainers": "Momentum detected. Watching for volume breakouts.",
        "losers": "Capitulation scanning active. Looking for reversal nodes.",
        "penny_gems": "High volatility in small-cap sectors. Proceed with lethal caution.",
        "new_listings": "Genesis block monitoring. Heavy capital rotation detected."
    }
    return {"advice": advices.get(category, "Analyzing data flow..."), "confidence": round(base_conf + (random.random() * 5), 1)}

async def fetch_fallback_data(client: httpx.AsyncClient):
    """Tertiary Node: Try CoinCap, then Paprika for global stats."""
    try:
        # Try CoinCap for markets
        res = await client.get(f"{COINCAP_BASE}/assets", params={"limit": 250}, timeout=10.0)
        data = res.json().get("data", []) if res.status_code == 200 else []
        
        processed = []
        for coin in data:
            price = float(coin.get("priceUsd", 0))
            change = float(coin.get("changePercent24Hr", 0))
            processed.append({
                "id": coin.get("id"), "name": coin.get("name"), "symbol": coin.get("symbol").upper(),
                "price": price, "formatted_price": f"${price:,.2f}" if price >= 0.01 else f"${price:.6f}",
                "change": change, "formatted_change": f"{change:+.2f}%",
                "image": None, "rank": int(coin.get("rank", 999)),
                "volume": f"${float(coin.get('volumeUsd24Hr', 0)) / 1e6:,.2f}M",
                "signals": ["FAILOVER_MODE"]
            })
        
        # Try CoinPaprika for global stats if needed
        global_stats = {"market_cap": "$1.5T", "bitcoin_dominance": "52%", "active_cryptos": "12,000+", "volume_24h": "$80B"}
        try:
            p_res = await client.get(f"{COINPAPRIKA_BASE}/global", timeout=5.0)
            if p_res.status_code == 200:
                p_data = p_res.json()
                global_stats = {
                    "market_cap": f"${int(p_data.get('market_cap_usd', 0) / 1e12):.1f}T",
                    "bitcoin_dominance": f"{p_data.get('bitcoin_dominance_percentage', 0):.1f}%",
                    "active_cryptos": f"{p_data.get('cryptocurrencies_number', 0):,}",
                    "volume_24h": f"${int(p_data.get('volume_24h_usd', 0) / 1e9):.1f}B",
                }
        except: pass
        
        return processed, global_stats
    except:
        return [], None

@app.get("/api/crypto/stats")
async def get_crypto_stats():
    now = time.time()
    if now < _stats_cache["backoff_until"] and _stats_cache["data"]:
        return _stats_cache["data"]
    if _stats_cache["data"] and (now - _stats_cache["last_sync"] < _stats_cache["ttl"]):
        return _stats_cache["data"]

    async with httpx.AsyncClient() as client:
        try:
            # Primary: CoinGecko
            g_task = client.get(f"{COINGECKO_BASE}/global", timeout=10.0)
            m_task = client.get(f"{COINGECKO_BASE}/coins/markets", params={"vs_currency": "usd", "per_page": 250}, timeout=10.0)
            t_task = client.get(f"{COINGECKO_BASE}/search/trending", timeout=10.0)
            
            responses = await asyncio.gather(g_task, m_task, t_task, return_exceptions=True)
            
            # Handle 429 specifically
            for r in responses:
                if not isinstance(r, Exception) and r.status_code == 429:
                    _stats_cache["backoff_until"] = now + 120
                    raise Exception("CG_RATE_LIMIT")

            # Parse primary
            g_json = responses[0].json().get("data", {})
            m_json = responses[1].json()
            t_json = responses[2].json().get("coins", [])

            processed = []
            for c in m_json:
                p = c.get("current_price", 0)
                processed.append({
                    "id": c.get("id"), "name": c.get("name"), "symbol": str(c.get("symbol", "??")).upper(),
                    "price": p, "formatted_price": f"${p:,.2f}" if p >= 0.01 else f"${p:.6f}",
                    "change": c.get("price_change_percentage_24h", 0) or 0,
                    "formatted_change": f"{c.get('price_change_percentage_24h', 0) or 0:+.2f}%",
                    "image": c.get("image"), "rank": c.get("market_cap_rank"),
                    "volume": f"${(c.get('total_volume',0)/1e6):,.2f}M",
                    "signals": calculate_signals(c)
                })

            result = {
                "global": {
                    "market_cap": f"${int(g_json.get('total_market_cap', {}).get('usd', 0) / 1e12):.1f}T",
                    "bitcoin_dominance": f"{g_json.get('market_cap_percentage', {}).get('btc', 0):.1f}%",
                    "active_cryptos": f"{g_json.get('active_cryptos', 0):,}",
                    "volume_24h": f"${int(g_json.get('total_volume', {}).get('usd', 0) / 1e9):.1f}B",
                },
                "data": {
                    "gainers": {"list": sorted(processed, key=lambda x: x['change'], reverse=True)[:20], "insight": get_tactical_advice("gainers", processed)},
                    "losers": {"list": sorted(processed, key=lambda x: x['change'])[:20], "insight": get_tactical_advice("losers", processed)},
                    "penny_gems": {"list": [c for c in processed if c['price'] < 0.5][:20], "insight": get_tactical_advice("penny_gems", processed)},
                    "new_listings": {"list": [], "insight": get_tactical_advice("new_listings", [])},
                },
                "source": "COINGECKO_PRIMARY"
            }
            _stats_cache["data"] = result
            _stats_cache["last_sync"] = now
            return result

        except Exception as e:
            print(f"FAILOVER_TRIGGERED :: {str(e)}")
            fallback_list, fallback_global = await fetch_fallback_data(client)
            if fallback_list:
                res = {
                    "global": fallback_global or {"market_cap": "N/A", "bitcoin_dominance": "N/A", "active_cryptos": "N/A", "volume_24h": "N/A"},
                    "data": {
                        "gainers": {"list": sorted(fallback_list, key=lambda x: x['change'], reverse=True)[:20], "insight": {"advice": "FAILOVER_STREAM_ACTIVE", "confidence": 60}},
                        "losers": {"list": sorted(fallback_list, key=lambda x: x['change'])[:20], "insight": {"advice": "FAILOVER_STREAM_ACTIVE", "confidence": 60}},
                        "penny_gems": {"list": [c for c in fallback_list if c['price'] < 0.5][:20], "insight": {"advice": "FAILOVER_STREAM_ACTIVE", "confidence": 60}},
                        "new_listings": {"list": [], "insight": {"advice": "OFFLINE", "confidence": 0}},
                    },
                    "source": "MULTI_API_FAILOVER"
                }
                _stats_cache["data"] = res
                _stats_cache["last_sync"] = now - 240 # Expire soon
                return res
            
            return _stats_cache["data"] or {"error": "MARKET_LINK_FATAL", "global": {"market_cap": "N/A", "bitcoin_dominance": "N/A", "active_cryptos": "N/A", "volume_24h": "N/A"}, "data": {}}
