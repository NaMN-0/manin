import pandas as pd
import os
import json
import datetime
import yfinance as yf
import requests
import io

TICKER_FILE = "penny_tickers.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_sp500_tickers():
    return [] # Deprecated used of sp500 in penny loader

def fetch_nasdaq_tickers_robust():
    """
    Fetches NASDAQ tickers directly from NASDAQ API.
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
        # Keys: symbol, name, lastsale, ...
        rows = data.get('data', {}).get('rows', [])
        tickers = [row['symbol'] for row in rows if 'symbol' in row]
        
        # Clean tickers (remove special chars if needed, though yfinance handles some)
        tickers = [t.strip() for t in tickers]
        # Sanitize for yfinance: ^ -> -P, / -> -
        tickers = [t.replace("^", "-P").replace("/", "-") for t in tickers]
        # Remove empty strings
        tickers = [t for t in tickers if t]
        
        if tickers:
            print(f"Fetched {len(tickers)} tickers from NASDAQ API.")
            return tickers
    except Exception as e:
        print(f"NASDAQ API failed: {e}")
        
    return []

def get_penny_stocks(max_price=5.0):
    """
    Fetches tickers from NASDAQ and filters for those under max_price.
    Note: 'yahoo_fin' returns all NASDAQ tickers. We need to filter them by price.
    Fetching price for ALL is slow, so we cache the result.
    """
    if os.path.exists(TICKER_FILE):
        # Check if cache is fresh (less than 24 hours)
        with open(TICKER_FILE, "r") as f:
            data = json.load(f)
            timestamp = datetime.datetime.fromisoformat(data["timestamp"])
            if datetime.datetime.now() - timestamp < datetime.timedelta(hours=24):
                print(f"Loaded {len(data['tickers'])} penny tickers from cache.")
                return data["tickers"]
    
    print("Fetching NASDAQ tickers...")
    nasdaq = fetch_nasdaq_tickers_robust()
    
    if not nasdaq:
        print("Critical: Could not fetch *any* tickers. Returning empty list.")
        return []

    print(f"Filtering {len(nasdaq)} tickers for Price < ${max_price}...")
    
    penny_tickers = []
    chunk_size = 500
    
    # Process in chunks to avoid overwhelming yfinance
    for i in range(0, len(nasdaq), chunk_size):
        batch = nasdaq[i:i+chunk_size]
        print(f"Processing batch {i} to {i+len(batch)}...")
        try:
            # Download only latest price
            data = yf.download(batch, period="1d", group_by='ticker', threads=True, progress=False)
            
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

            if len(batch) == 1:
                # Single ticker case
                p = get_price(data)
                if p < max_price:
                    penny_tickers.append(batch[0])
            else:
                for ticker in batch:
                    try:
                        # Access ticker data from the multi-index DF
                        if ticker in data.columns.levels[0]:
                             df = data[ticker]
                             p = get_price(df)
                             if p < max_price and p > 0.01: # Also filter out total dead/zero price
                                 penny_tickers.append(ticker)
                    except Exception:
                        continue
                        
        except Exception as e:
            print(f"Batch error: {e}")
            continue

    print(f"Found {len(penny_tickers)} penny stocks.")
    
    # Save to cache
    with open(TICKER_FILE, "w") as f:
        json.dump({"timestamp": str(datetime.datetime.now()), "tickers": penny_tickers}, f)
        
    return penny_tickers

if __name__ == "__main__":
    t = get_penny_stocks()
    print(f"Sample: {t[:10]}")
