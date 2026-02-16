import pandas as pd
import os
import json
import datetime
import yfinance as yf
import concurrent.futures
import random

# Fix for yfinance cache issue in containerized environments
try:
    yf.set_tz_cache_location("/tmp/yfinance_cache")
except Exception:
    pass

import requests
import io
# Fix for yfinance Invalid Crumb issue
# yfinance now uses curl_cffi internally; manual sessions often conflict.

TICKER_FILE = "penny_tickers.json"
SECTOR_FILE = "penny_sectors.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_sp500_tickers():
    return [] # Deprecated used of sp500 in penny loader

def fetch_nasdaq_tickers_robust():
    """
    Fetches NASDAQ tickers directly from NASDAQ API.
    Returns a list of dicts: {'symbol': '...', 'sector': '...', 'industry': '...'}
    """
    # 1. Try NASDAQ API directly
    try:
        print("Fetching via NASDAQ API...")
        # This URL returns all stocks on NASDAQ
        url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=25&offset=0&download=true"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        
        # Structure: data['data']['rows'] which is a list of dicts
        rows = data.get('data', {}).get('rows', [])
        
        results = []
        for row in rows:
            symbol = row.get('symbol')
            if not symbol: continue
            
            # Sanitize
            symbol = symbol.strip().replace("^", "-P").replace("/", "-")
            
            # Extract metadata
            sector = row.get('sector', 'Unknown')
            industry = row.get('industry', 'Unknown')
            
            results.append({
                "symbol": symbol,
                "sector": sector,
                "industry": industry
            })
        
        if results:
            print(f"Fetched {len(results)} tickers from NASDAQ API.")
            return results
    except Exception as e:
        print(f"NASDAQ API failed: {e}")
        
    return []

def get_penny_stocks(max_price=5.0):
    """
    Fetches tickers from NASDAQ and filters for those under max_price.
    Caches tickers AND metadata (sector/industry).
    Returns list of ticker strings (for compatibility).
    """
    if os.path.exists(TICKER_FILE):
        # Check if cache is fresh (less than 24 hours)
        try:
            with open(TICKER_FILE, "r") as f:
                data = json.load(f)
                timestamp = datetime.datetime.fromisoformat(data.get("timestamp", "2000-01-01T00:00:00"))
                if datetime.datetime.now() - timestamp < datetime.timedelta(hours=24):
                    print(f"Loaded {len(data['tickers'])} penny tickers from cache.")
                    return data["tickers"]
        except Exception:
            pass # corrupted cache, re-fetch
    
    print("Fetching NASDAQ tickers...")
    nasdaq_data = fetch_nasdaq_tickers_robust()
    
    if not nasdaq_data:
        print("Critical: Could not fetch *any* tickers. Returning empty list.")
        return []

    print(f"Filtering {len(nasdaq_data)} tickers for Price < ${max_price}...")
    
    penny_tickers = []
    penny_metadata = {}
    
    # Extract just symbols for batch processing
    all_symbols = [item['symbol'] for item in nasdaq_data]
    
    chunk_size = 500
    
    # Process in chunks to avoid overwhelming yfinance
    for i in range(0, len(all_symbols), chunk_size):
        batch_symbols = all_symbols[i:i+chunk_size]
        # Map symbol -> metadata for this batch
        batch_meta = {item['symbol']: item for item in nasdaq_data if item['symbol'] in batch_symbols}
        
        print(f"Processing batch {i} to {i+len(batch_symbols)}...")
        try:
            # Download only latest price
            data = yf.download(batch_symbols, period="1d", group_by='ticker', threads=True, progress=False)
            
            # Helper to extract price safely
            def get_price(ticker_data):
                try:
                    # Handle MultiIndex logic
                    if isinstance(ticker_data, pd.DataFrame):
                        if 'Close' in ticker_data.columns:
                            val = ticker_data['Close'].iloc[-1]
                            return val if not pd.isna(val) else 1000
                    elif isinstance(ticker_data, pd.Series): # Single row case
                         return ticker_data['Close']
                    return 1000
                except:
                    return 1000

            if len(batch_symbols) == 1:
                # Single ticker case
                t = batch_symbols[0]
                p = get_price(data)
                if p < max_price:
                    penny_tickers.append(t)
                    penny_metadata[t] = {
                        "sector": batch_meta[t].get("sector", "Unknown"),
                        "industry": batch_meta[t].get("industry", "Unknown")
                    }
            else:
                for ticker in batch_symbols:
                    try:
                        # Access ticker data from the multi-index DF
                        if ticker in data.columns.levels[0]:
                             df = data[ticker]
                             p = get_price(df)
                             if p < max_price and p > 0.01: # Also filter out total dead/zero price
                                 penny_tickers.append(ticker)
                                 penny_metadata[ticker] = {
                                     "sector": batch_meta.get(ticker, {}).get("sector", "Unknown"),
                                     "industry": batch_meta.get(ticker, {}).get("industry", "Unknown")
                                 }
                    except Exception:
                        continue
                        
        except Exception as e:
            print(f"Batch error: {e}")
            continue

        # Incremental Save to cache (so we have data even if interrupted)
        try:
            with open(TICKER_FILE, "w") as f:
                json.dump({
                    "timestamp": str(datetime.datetime.now()), 
                    "tickers": penny_tickers,
                    "metadata": penny_metadata
                }, f)
        except Exception as e:
            print(f"Cache save failed: {e}")

    print(f"Found {len(penny_tickers)} penny stocks.")
    
    # Final Save
    with open(TICKER_FILE, "w") as f:
        json.dump({
            "timestamp": str(datetime.datetime.now()), 
            "tickers": penny_tickers,
            "metadata": penny_metadata
        }, f)
        
    return penny_tickers

def get_ticker_metadata():
    """Returns the cached metadata (sector/industry) for penny stocks."""
    if os.path.exists(TICKER_FILE):
        try:
            with open(TICKER_FILE, "r") as f:
                data = json.load(f)
                return data.get("metadata", {})
        except:
            return {}
    return {}

def get_penny_sectors(force_refresh=False):
    """
    Returns a mapping of ticker to sector/industry for the current penny universe.
    Caches the result to avoid slow yfinance info calls.
    """
    sectors = {}
    if os.path.exists(SECTOR_FILE) and not force_refresh:
        with open(SECTOR_FILE, "r") as f:
            sectors = json.load(f)
            # If cache is from today, it's good
            return sectors

    # Load tickers
    tickers = get_penny_stocks()
    if not tickers:
        return {}

    print(f"Building sector map for {len(tickers)} stocks... (Using Parallel Threads)")
    
    def fetch_info(ticker):
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            return ticker, {
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown")
            }
        except Exception:
            return ticker, {"sector": "Unknown", "industry": "Unknown"}

    # Filter tickers already in sectors
    missing_tickers = [t for t in tickers if t not in sectors]
    
    if missing_tickers:
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_ticker = {executor.submit(fetch_info, t): t for t in missing_tickers}
            for i, future in enumerate(concurrent.futures.as_completed(future_to_ticker)):
                t, info = future.result()
                sectors[t] = info
                if i % 20 == 0:
                    with open(SECTOR_FILE, "w") as f:
                        json.dump(sectors, f)
                    print(f"Progress: {i}/{len(missing_tickers)} tickers mapped...")

    with open(SECTOR_FILE, "w") as f:
        json.dump(sectors, f)
        
    return sectors

def get_random_tickers(count=20):
    """
    Returns a random subset of tickers from the cached penny universe.
    """
    if os.path.exists(TICKER_FILE):
        with open(TICKER_FILE, "r") as f:
            data = json.load(f)
            tickers = data.get("tickers", [])
            if tickers:
                return random.sample(tickers, min(count, len(tickers)))
    return []

if __name__ == "__main__":
    t = get_penny_stocks()
    print(f"Sample: {t[:10]}")
