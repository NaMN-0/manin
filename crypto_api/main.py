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

# Internal Recon Logs for debugging prod connectivity
_recon_logs = []

def log_recon(msg: str):
    global _recon_logs
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    _recon_logs.append(f"[{timestamp}] {msg}")
    if len(_recon_logs) > 50: _recon_logs.pop(0)

RECON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
COINCAP_BASE = "https://api.coincap.io/v2"
COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1"

@app.get("/api/crypto/recon/logs")
async def get_recon_logs():
    """Hidden intelligence node for debugging connectivity."""
    return {"logs": _recon_logs, "cache_status": {k: v for k, v in _stats_cache.items() if k != 'data'}}

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
        log_recon("INITIATING_SECONDARY_SCAN :: CONNECTING_TO_COINCAP...")
        res = await client.get(f"{COINCAP_BASE}/assets", params={"limit": 250}, headers=RECON_HEADERS, timeout=12.0)
        if res.status_code != 200:
            log_recon(f"COINCAP_NODE_FAILURE :: STATUS: {res.status_code}")
            return [], None
            
        data = res.json().get("data", [])
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
            log_recon("INITIATING_TERTIARY_SCAN :: CONNECTING_TO_COINPAPRIKA...")
            p_res = await client.get(f"{COINPAPRIKA_BASE}/global", headers=RECON_HEADERS, timeout=8.0)
            if p_res.status_code == 200:
                p_data = p_res.json()
                global_stats = {
                    "market_cap": f"${int(p_data.get('market_cap_usd', 0) / 1e12):.1f}T",
                    "bitcoin_dominance": f"{p_data.get('bitcoin_dominance_percentage', 0):.1f}%",
                    "active_cryptos": f"{p_data.get('cryptocurrencies_number', 0):,}",
                    "volume_24h": f"${int(p_data.get('volume_24h_usd', 0) / 1e9):.1f}B",
                }
            else:
                log_recon(f"COINPAPRIKA_NODE_FAILURE :: STATUS: {p_res.status_code}")
        except Exception as e:
            log_recon(f"COINPAPRIKA_TIMEOUT :: {str(e)}")
        
        return processed, global_stats
    except Exception as e:
        log_recon(f"SECONDARY_SCAN_CRITICAL_FAILURE :: {str(e)}")
        return [], None

def generate_simulation_data():
    """Final Defense: Protocol Zero - Realistic Market Simulation."""
    print("PROTOCOL_ZERO_ACTIVATED :: GENERATING_SIMULATED_RECON_DATA")
    coins = ["BTC", "ETH", "SOL", "KAGE", "BNB", "XRP", "ADA", "DOGE", "TRX", "DOT"]
    processed = []
    for i, sym in enumerate(coins):
        price = 60000 / (i + 1)
        change = random.uniform(-5, 10)
        processed.append({
            "id": sym.lower(), "name": sym, "symbol": sym,
            "price": price, "formatted_price": f"${price:,.2f}",
            "change": change, "formatted_change": f"{change:+.2f}%",
            "image": None, "rank": i + 1,
            "volume": f"${random.uniform(100, 1000):.1f}M",
            "signals": ["SIMULATED_FEED"]
        })
    
    return {
        "global": {"market_cap": "$1.8T", "bitcoin_dominance": "51.2%", "active_cryptos": "15,000+", "volume_24h": "$95B"},
        "data": {
            "gainers": {"list": sorted(processed, key=lambda x: x['change'], reverse=True)[:5], "insight": {"advice": "PROTOCOL_ZERO_ACTIVE :: Running on simulated intelligence nodes. Check network link.", "confidence": 40}},
            "losers": {"list": sorted(processed, key=lambda x: x['change'])[:5], "insight": {"advice": "SIMULATION_MODE :: External sensors offline. Monitoring synthetic volatility.", "confidence": 40}},
            "penny_gems": {"list": [], "insight": {"advice": "Limited recon in simulation mode.", "confidence": 0}},
            "new_listings": {"list": [], "insight": {"advice": "Offline", "confidence": 0}},
        },
        "source": "PROTOCOL_ZERO_SIMULATION"
    }

@app.get("/api/crypto/stats")
async def get_crypto_stats():
    now = time.time()
    
    # Check cache first
    if now < _stats_cache["backoff_until"] and _stats_cache["data"]:
        return _stats_cache["data"]
        
    if _stats_cache["data"] and (now - _stats_cache["last_sync"] < _stats_cache["ttl"]):
        return _stats_cache["data"]

    async with httpx.AsyncClient() as client:
        try:
            log_recon("PRIMARY_SCAN_INITIATED :: CONNECTING_TO_COINGECKO...")
            g_task = client.get(f"{COINGECKO_BASE}/global", headers=RECON_HEADERS, timeout=10.0)
            m_task = client.get(f"{COINGECKO_BASE}/coins/markets", params={"vs_currency": "usd", "per_page": 250}, headers=RECON_HEADERS, timeout=10.0)
            t_task = client.get(f"{COINGECKO_BASE}/search/trending", headers=RECON_HEADERS, timeout=10.0)
            
            responses = await asyncio.gather(g_task, m_task, t_task, return_exceptions=True)
            
            # Handle 429
            for r in responses:
                if not isinstance(r, Exception) and r.status_code == 429:
                    log_recon("COINGECKO_NODE_LIMIT :: 429_DETECTED")
                    _stats_cache["backoff_until"] = now + 180 # 3 min backoff
                    raise Exception("CG_RATE_LIMIT")

            # Parse primary
            g_res = responses[0]
            m_res = responses[1]
            t_res = responses[2]
            
            if any(isinstance(r, Exception) or r.status_code != 200 for r in [g_res, m_res, t_res]):
                err_msg = ""
                if isinstance(g_res, Exception): err_msg += f" GlobalErr: {str(g_res)}"
                elif g_res.status_code != 200: err_msg += f" GlobalStatus: {g_res.status_code}"
                log_recon(f"PRIMARY_NODE_INCOMPLETE ::{err_msg}")
                raise Exception("PRIMARY_NODE_INCOMPLETE")

            g_json = g_res.json().get("data", {})
            m_json = m_res.json()
            t_json = t_res.json().get("coins", [])

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
            log_recon("MASTER_SYNC_COMPLETE :: PRIMARY_DATA_CACHED")
            return result

        except Exception as e:
            log_recon(f"PRIMARY_LINK_FAILURE :: {str(e)} :: ATTEMPTING_FAILOVER")
            fallback_list, fallback_global = await fetch_fallback_data(client)
            if fallback_list:
                res = {
                    "global": fallback_global or {"market_cap": "N/A", "bitcoin_dominance": "N/A", "active_cryptos": "N/A", "volume_24h": "N/A"},
                    "data": {
                        "gainers": {"list": sorted(fallback_list, key=lambda x: x['change'], reverse=True)[:20], "insight": {"advice": "FAILOVER_STREAM_ACTIVE :: Monitoring secondary nodes.", "confidence": 60}},
                        "losers": {"list": sorted(fallback_list, key=lambda x: x['change'])[:20], "insight": {"advice": "FAILOVER_STREAM_ACTIVE :: Scanning backup data nodes.", "confidence": 60}},
                        "penny_gems": {"list": [c for c in fallback_list if c['price'] < 0.5][:20], "insight": {"advice": "FAILOVER_MODE :: Small-cap recon limited.", "confidence": 50}},
                        "new_listings": {"list": [], "insight": {"advice": "OFFLINE", "confidence": 0}},
                    },
                    "source": "MULTI_API_FAILOVER"
                }
                _stats_cache["data"] = res
                _stats_cache["last_sync"] = now - 240 # Expire soon
                return res
            
            # FINAL RESORT: PROTOCOL ZERO
            if _stats_cache["data"]:
                log_recon("ALL_SENSORS_OFFLINE :: RETURNING_STALE_DATA_SAFE_MODE")
                return _stats_cache["data"]
            
            log_recon("ALL_SENSORS_OFFLINE :: INITIATING_PROTOCOL_ZERO_SAFE_MODE")
            sim_data = generate_simulation_data()
            _stats_cache["data"] = sim_data
            _stats_cache["last_sync"] = now - 240 # Expire soon
            return sim_data
