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

# KAGE AI Tactical Blacklist: No Majors in "New Listings"
MAJORS_BLACKLIST = {"BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "TRX", "DOT", "MATIC", "LINK", "LTC", "BCH", "SHIB", "AVAX", "DAI", "WBTC", "UNI", "LEO", "ATOM"}

# Advanced Bot-Bypass Header Bank
RECON_HEADER_BANK = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
    },
    {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "application/json",
    }
]

def get_rotated_headers():
    return random.choice(RECON_HEADER_BANK)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
COINCAP_BASE = "https://api.coincap.io/v2"
COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1"
COINLORE_BASE = "https://api.coinlore.net/api"
CRYPTOCOMPARE_BASE = "https://min-api.cryptocompare.com/data"

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
    avg_change = sum(c.get('change', 0) for c in data) / len(data) if data else 0
    signal_count = sum(len(c.get('signals', [])) for c in data)
    base_conf = 70.0 + min(signal_count * 2, 20)
    
    advices = {
        "gainers": "Momentum detected. Watching for volume breakouts.",
        "losers": "Capitulation scanning active. Looking for reversal nodes.",
        "penny_gems": "High volatility in small-cap sectors. Proceed with lethal caution.",
        "new_listings": "Genesis block monitoring. Heavy capital rotation detected."
    }
    return {"advice": advices.get(category, "Analyzing data flow..."), "confidence": round(base_conf + (random.random() * 5), 1)}

async def fetch_trending_fallback(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """Hot listings fallback node (CryptoCompare)."""
    trending = []
    headers = get_rotated_headers()
    try:
        # Fetching top coins by 24h volume
        res = await client.get(f"{CRYPTOCOMPARE_BASE}/top/totalvolfull", params={"limit": 30, "tsym": "USD"}, headers=headers, timeout=8.0)
        if res.status_code == 200:
            data = res.json().get("Data", [])
            for item in data:
                info = item.get("CoinInfo", {})
                raw = item.get("RAW", {}).get("USD", {})
                sym = str(info.get("Name", "")).upper()
                if sym in MAJORS_BLACKLIST: continue # Still filter majors
                
                trending.append({
                    "id": info.get("Name"), "name": info.get("FullName"), "symbol": sym,
                    "price": raw.get("PRICE", 0), "formatted_price": f"${raw.get('PRICE', 0):,.2f}", 
                    "change": raw.get("CHANGEPCT24HOUR", 0), "formatted_change": "HOT",
                    "image": f"https://www.cryptocompare.com{info.get('ImageUrl')}", 
                    "rank": 999,
                    "volume": "HIGH_VOL",
                    "signals": ["TRENDING_FAILOVER"]
                })
        log_recon("RECON :: TRENDING_FALLBACK_ACQUIRED")
    except Exception as e:
        log_recon(f"RECON :: TRENDING_FALLBACK_FAILURE: {str(e)}")
    return trending

async def fetch_fallback_data(client: httpx.AsyncClient):
    """Tier 2 Fidelity Node: Using CryptoCompare/CoinCap for high-quality stream."""
    processed = []
    global_stats = {"market_cap": "N/A", "bitcoin_dominance": "N/A", "active_cryptos": "N/A", "volume_24h": "N/A"}
    headers = get_rotated_headers()
    
    # 1. Try CryptoCompare (High Fidelity Tier 2)
    log_recon("RECON :: ATTEMPTING_TIER_2_CRYPTOCOMPARE_NODE...")
    try:
        res = await client.get(f"{CRYPTOCOMPARE_BASE}/top/mktcapfull", params={"limit": 50, "tsym": "USD"}, headers=headers, timeout=8.0)
        if res.status_code == 200:
            data = res.json().get("Data", [])
            for item in data:
                info = item.get("CoinInfo", {})
                raw = item.get("RAW", {}).get("USD", {})
                price = raw.get("PRICE", 0)
                change = raw.get("CHANGEPCT24HOUR", 0)
                processed.append({
                    "id": info.get("Name"), "name": info.get("FullName"), "symbol": info.get("Name").upper(),
                    "price": price, "formatted_price": f"${price:,.2f}" if price >= 0.01 else f"${price:.6f}",
                    "change": change, "formatted_change": f"{change:+.2f}%",
                    "image": f"https://www.cryptocompare.com{info.get('ImageUrl')}", 
                    "rank": 999,
                    "volume": f"${raw.get('VOLUME24HOUR', 0) / 1e6:,.2f}M",
                    "signals": ["FAILOVER_NODE_COMPARE"]
                })
            log_recon("RECON :: CRYPTOCOMPARE_DATA_ACQUIRED")
    except Exception as e:
        log_recon(f"RECON :: CRYPTOCOMPARE_FAILURE: {str(e)}")

    # 2. Try CoinCap (Backup Fidelity)
    if not processed:
        log_recon("RECON :: ATTEMPTING_SECONDARY_LEVEL_COINCAP...")
        try:
            res = await client.get(f"{COINCAP_BASE}/assets", params={"limit": 100}, headers=headers, timeout=8.0)
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
        except Exception as e:
            log_recon(f"RECON :: COINCAP_FAILURE: {str(e)}")

    # 3. Global Stats Node
    log_recon("RECON :: SYNCING_GLOBAL_STATS_NODE...")
    try:
        p_res = await client.get(f"{COINPAPRIKA_BASE}/global", headers=headers, timeout=6.0)
        if p_res.status_code == 200:
            p_data = p_res.json()
            global_stats = {
                "market_cap": f"${int(p_data.get('market_cap_usd', 0) / 1e12):.1f}T",
                "bitcoin_dominance": f"{p_data.get('bitcoin_dominance_percentage', 0):.1f}%",
                "active_cryptos": f"{p_data.get('cryptocurrencies_number', 0):,}",
                "volume_24h": f"${int(p_data.get('volume_24h_usd', 0) / 1e9):.1f}B",
            }
            log_recon("RECON :: GLOBAL_STATS_ACQUIRED")
    except Exception as e:
        log_recon(f"RECON :: GLOBAL_STATS_FAILURE: {str(e)}")

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
    
    if _stats_cache["data"]:
        age = now - _stats_cache["last_sync"]
        if age < _stats_cache["ttl"]:
            return _stats_cache["data"]
        if now < _stats_cache["backoff_until"]:
            return _stats_cache["data"]

    async with httpx.AsyncClient() as client:
        try:
            log_recon("RECON :: PRIMARY_SCAN_STARTING...")
            headers = get_rotated_headers()
            g_task = client.get(f"{COINGECKO_BASE}/global", headers=headers, timeout=10.0)
            m_task = client.get(f"{COINGECKO_BASE}/coins/markets", params={"vs_currency": "usd", "per_page": 250}, headers=headers, timeout=10.0)
            t_task = client.get(f"{COINGECKO_BASE}/search/trending", headers=headers, timeout=10.0)
            
            responses = await asyncio.gather(g_task, m_task, t_task, return_exceptions=True)
            
            for r in responses:
                if not isinstance(r, Exception) and r.status_code == 429:
                    log_recon("RECON :: COINGECKO_RATE_LIMITED (429)")
                    _stats_cache["backoff_until"] = now + 180 
                    raise Exception("CG_RATE_LIMIT")

            g_res, m_res, t_res = responses
            if any(isinstance(r, Exception) or r.status_code != 200 for r in [g_res, m_res, t_res]):
                log_recon("RECON :: PRIMARY_NODE_FAILURE :: TRIGGERING_FALLOVER")
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

            # Process trending as "New/Hot Listings" + EXCLUDE MAJORS
            trending_processed = []
            for t in t_json:
                item = t.get("item", {})
                sym = str(item.get("symbol", "")).upper()
                if sym in MAJORS_BLACKLIST: continue # Ninja Ghost Filter
                
                trending_processed.append({
                    "id": item.get("id"), "name": item.get("name"), "symbol": sym,
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
            # Concurrent fallback recon
            f_list_task = fetch_fallback_data(client)
            f_trend_task = fetch_trending_fallback(client)
            
            f_data, f_trending = await asyncio.gather(f_list_task, f_trend_task)
            f_list, f_global = f_data
            
            if f_list:
                res = {
                    "global": f_global,
                    "data": {
                        "gainers": {"list": sorted(f_list, key=lambda x: x['change'], reverse=True)[:20], "insight": {"advice": "FAILOVER_NODES_ACTIVE :: High-fidelity tertiary stream.", "confidence": 60}},
                        "losers": {"list": sorted(f_list, key=lambda x: x['change'])[:20], "insight": {"advice": "FAILOVER_NODES_ACTIVE :: Scanning backup data nodes.", "confidence": 60}},
                        "penny_gems": {"list": [c for c in f_list if c['price'] < 0.5][:20], "insight": {"advice": "FAILOVER_MODE :: Small-cap recon active.", "confidence": 55}},
                        "new_listings": {"list": f_trending if f_trending else [c for c in f_list if c['symbol'] not in MAJORS_BLACKLIST][:20], "insight": {"advice": "FAILOVER_TRENDING_NODE_ACTIVE", "confidence": 50}},
                    },
                    "source": "MULTI_NODE_FAILOVER"
                }
                _stats_cache["data"] = res
                _stats_cache["last_sync"] = now
                return res
            
            if _stats_cache["data"] and _stats_cache["data"].get("source") != "PROTOCOL_ZERO_SIMULATION":
                log_recon("RECON :: ALL_NODES_OFFLINE :: RETURNING_STALE_CACHE")
                return _stats_cache["data"]
            
            log_recon("RECON :: TOTAL_SENSOR_BLACKOUT :: ENGAGING_PROTOCOL_ZERO")
            sim_data = generate_simulation_data()
            _stats_cache["data"] = sim_data
            _stats_cache["last_sync"] = now
            return sim_data
