import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import asyncio
import time
import random

app = FastAPI(title="KAGE AI API", version="0.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """KAGE AI - Tactical Intelligence Command Center"""
    return {
        "status": "OPERATIONAL",
        "identity": "KAGE_AI_CORE",
        "version": "0.5.0",
        "message": "Tactical market intelligence streams are live.",
        "nodes": {
            "primary": "COINGECKO",
            "failover": ["COINCAP", "COINLORE", "COINPAPRIKA"],
            "safety": "PROTOCOL_ZERO_SIMULATION"
        },
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    """Automated health diagnostic."""
    return {"status": "ok", "timestamp": time.time()}

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
    print(f"RECON :: {msg}")
    if len(_recon_logs) > 50: _recon_logs.pop(0)

RECON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
COINCAP_BASE = "https://api.coincap.io/v2"
COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1"
COINLORE_BASE = "https://api.coinlore.net/api"

@app.get("/api/crypto/recon/logs")
async def get_recon_logs():
    """Hidden intelligence node for debugging connectivity."""
    return {
        "logs": _recon_logs, 
        "status": "OPERATIONAL",
        "cache": {k: v for k, v in _stats_cache.items() if k != 'data'}
    }

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
    """Discrete Node failover: Each source is independent."""
    processed = []
    global_stats = {"market_cap": "N/A", "bitcoin_dominance": "N/A", "active_cryptos": "N/A", "volume_24h": "N/A"}
    
    # Tier 1 Fallback: CoinCap for Markets
    log_recon("RECON :: ATTEMPTING_DISCRETE_NODE_COINCAP...")
    try:
        res = await client.get(f"{COINCAP_BASE}/assets", params={"limit": 250}, headers=RECON_HEADERS, timeout=8.0)
        if res.status_code == 200:
            data = res.json().get("data", [])
            for coin in data:
                price = float(coin.get("priceUsd", 0))
                change = float(coin.get("changePercent24Hr", 0))
                processed.append({
                    "id": coin.get("id"), "name": coin.get("name"), "symbol": coin.get("symbol").upper(),
                    "price": price, "formatted_price": f"${price:,.2f}" if price >= 0.01 else f"${price:.6f}",
                    "change": change, "formatted_change": f"{change:+.2f}%",
                    "image": None, "rank": int(coin.get("rank", 999)),
                    "volume": f"${float(coin.get('volumeUsd24Hr', 0)) / 1e6:,.2f}M",
                    "signals": ["FAILOVER_NODE_CAP"]
                })
            log_recon("RECON :: COINCAP_DATA_ACQUIRED")
        else:
            log_recon(f"RECON :: COINCAP_STATUS_ERROR: {res.status_code}")
    except Exception as e:
        log_recon(f"RECON :: COINCAP_DNS_OR_NET_ERROR: {str(e)}")

    # Tier 2 Fallback: CoinLore for Markets (If CoinCap failed or returned empty)
    if not processed:
        log_recon("RECON :: ATTEMPTING_DISCRETE_NODE_COINLORE...")
        try:
            res = await client.get(f"{COINLORE_BASE}/tickers/", headers=RECON_HEADERS, timeout=8.0)
            if res.status_code == 200:
                data = res.json().get("data", [])
                for coin in data:
                    price = float(coin.get("price_usd", 0))
                    change = float(coin.get("percent_change_24h", 0))
                    processed.append({
                        "id": coin.get("id"), "name": coin.get("name"), "symbol": coin.get("symbol").upper(),
                        "price": price, "formatted_price": f"${price:,.2f}" if price >= 0.01 else f"${price:.6f}",
                        "change": change, "formatted_change": f"{change:+.2f}%",
                        "image": None, "rank": int(coin.get("rank", 999)),
                        "volume": "HIDDEN",
                        "signals": ["FAILOVER_NODE_LORE"]
                    })
                log_recon("RECON :: COINLORE_DATA_ACQUIRED")
        except Exception as e:
            log_recon(f"RECON :: COINLORE_ERROR: {str(e)}")

    # Tier 3 Fallback: CoinPaprika for Global Stats
    log_recon("RECON :: ATTEMPTING_DISCRETE_NODE_PAPRIKA_GLOBAL...")
    try:
        p_res = await client.get(f"{COINPAPRIKA_BASE}/global", headers=RECON_HEADERS, timeout=6.0)
        if p_res.status_code == 200:
            p_data = p_res.json()
            global_stats = {
                "market_cap": f"${int(p_data.get('market_cap_usd', 0) / 1e12):.1f}T",
                "bitcoin_dominance": f"{p_data.get('bitcoin_dominance_percentage', 0):.1f}%",
                "active_cryptos": f"{p_data.get('cryptocurrencies_number', 0):,}",
                "volume_24h": f"${int(p_data.get('volume_24h_usd', 0) / 1e9):.1f}B",
            }
            log_recon("RECON :: GLOBAL_STATS_PAPRIKA_ACQUIRED")
        else:
            log_recon(f"RECON :: COINPAPRIKA_STATUS_ERROR: {p_res.status_code}")
    except Exception as e:
        log_recon(f"RECON :: PAPRIKA_GLOBAL_ERROR: {str(e)}")

    return processed, global_stats

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
    
    # 1. Cache Hygiene & Smart Filtering
    if _stats_cache["data"]:
        age = now - _stats_cache["last_sync"]
        source = _stats_cache["data"].get("source")
        
        # If cache is fresh (< 5 mins), return always
        if age < _stats_cache["ttl"]:
            return _stats_cache["data"]
            
        # If we reached backoff from 429s, return stale data always
        if now < _stats_cache["backoff_until"]:
            return _stats_cache["data"]

    async with httpx.AsyncClient() as client:
        try:
            log_recon("RECON :: PRIMARY_SCAN_STARTING...")
            g_task = client.get(f"{COINGECKO_BASE}/global", headers=RECON_HEADERS, timeout=10.0)
            m_task = client.get(f"{COINGECKO_BASE}/coins/markets", params={"vs_currency": "usd", "per_page": 250}, headers=RECON_HEADERS, timeout=10.0)
            t_task = client.get(f"{COINGECKO_BASE}/search/trending", headers=RECON_HEADERS, timeout=10.0)
            
            responses = await asyncio.gather(g_task, m_task, t_task, return_exceptions=True)
            
            # Status check
            for r in responses:
                if not isinstance(r, Exception) and r.status_code == 429:
                    log_recon("RECON :: COINGECKO_RATE_LIMITED (429)")
                    _stats_cache["backoff_until"] = now + 180 # 3 min backoff
                    raise Exception("CG_RATE_LIMIT")

            g_res, m_res, t_res = responses
            if any(isinstance(r, Exception) or r.status_code != 200 for r in [g_res, m_res, t_res]):
                err_info = ""
                if isinstance(m_res, Exception): err_info = f"NetError: {str(m_res)}"
                elif m_res.status_code != 200: err_info = f"HttpStatus: {m_res.status_code}"
                log_recon(f"RECON :: PRIMARY_NODE_FAILURE :: {err_info}")
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

            # Process trending as "New/Hot Listings"
            trending_processed = []
            for t in t_json:
                item = t.get("item", {})
                trending_processed.append({
                    "id": item.get("id"), "name": item.get("name"), "symbol": item.get("symbol", "").upper(),
                    "price": 0, "formatted_price": "SCANNING", 
                    "change": 0, "formatted_change": "HOT",
                    "image": item.get("small"), "rank": item.get("market_cap_rank", 999),
                    "volume": "TRENDING",
                    "signals": ["NEW_LISTING"]
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
                    "new_listings": {"list": trending_processed[:20], "insight": get_tactical_advice("new_listings", trending_processed)},
                },
                "source": "COINGECKO_PRIMARY"
            }
            _stats_cache["data"] = result
            _stats_cache["last_sync"] = now
            log_recon("RECON :: MASTER_SYNC_COMPLETE")
            return result

        except Exception as e:
            log_recon(f"RECON :: FALLOVER_TRIGGERED :: {str(e)}")
            f_list, f_global = await fetch_fallback_data(client)
            
            if f_list:
                res = {
                    "global": f_global,
                    "data": {
                        "gainers": {"list": sorted(f_list, key=lambda x: x['change'], reverse=True)[:20], "insight": {"advice": "FAILOVER_NODES_ACTIVE :: Monitoring secondary streams.", "confidence": 60}},
                        "losers": {"list": sorted(f_list, key=lambda x: x['change'])[:20], "insight": {"advice": "FAILOVER_NODES_ACTIVE :: Monitoring secondary streams.", "confidence": 60}},
                        "penny_gems": {"list": [c for c in f_list if c['price'] < 0.5][:20], "insight": {"advice": "FAILOVER_MODE :: Limited small-cap data.", "confidence": 50}},
                        "new_listings": {"list": [], "insight": {"advice": "OFFLINE", "confidence": 0}},
                    },
                    "source": "MULTI_NODE_FAILOVER"
                }
                _stats_cache["data"] = res
                _stats_cache["last_sync"] = now
                return res
            
            # FINAL RESORT: PROTOCOL ZERO
            if _stats_cache["data"] and _stats_cache["data"].get("source") != "PROTOCOL_ZERO_SIMULATION":
                log_recon("RECON :: ALL_NODES_OFFLINE :: RETURNING_STALE_CACHE")
                return _stats_cache["data"]
            
            log_recon("RECON :: TOTAL_SENSOR_BLACKOUT :: ENGAGING_PROTOCOL_ZERO")
            sim_data = generate_simulation_data()
            _stats_cache["data"] = sim_data
            _stats_cache["last_sync"] = now
            return sim_data
