import yahoo_fin.stock_info as si
import json
import os
import datetime
import pandas as pd
import requests
import io

TICKER_FILE = "tickers.json"

# Headers to mimic a real browser to avoid 403 Forbidden
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_sp500_tickers():
    try:
        return si.tickers_sp500()
    except Exception as e:
        print(f"yahoo_fin S&P 500 failed: {e}. Trying fallback...")
        try:
            url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status()
            table = pd.read_html(io.StringIO(response.text))
            df = table[0]
            return df['Symbol'].tolist()
        except Exception as e2:
            print(f"Fallback S&P 500 failed: {e2}")
            return []

def get_nasdaq_tickers():
    try:
        return si.tickers_nasdaq()
    except Exception as e:
        print(f"yahoo_fin NASDAQ failed: {e}. Trying fallback...")
        try:
             # Fallback for NASDAQ 100 (often what people mean by NASDAQ universe)
            url = "https://en.wikipedia.org/wiki/Nasdaq-100"
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status()
            table = pd.read_html(io.StringIO(response.text))
            # Wikipedia NASDAQ-100 table index varies, usually table 4 or class specific
            # But let's look for a table with 'Ticker' or 'Symbol'
            for t in table:
                if 'Ticker' in t.columns:
                    return t['Ticker'].tolist()
                elif 'Symbol' in t.columns:
                    return t['Symbol'].tolist()
            return []
        except Exception as e2:
            print(f"Fallback NASDAQ failed: {e2}")
            return []

def get_dow_tickers():
    try:
        return si.tickers_dow()
    except Exception as e:
        print(f"yahoo_fin Dow failed: {e}. Trying fallback...")
        try:
            url = "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average"
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status()
            table = pd.read_html(io.StringIO(response.text))
            # Usually the first table or second
            for t in table:
                if 'Symbol' in t.columns:
                    return t['Symbol'].tolist()
                elif 'Ticker' in t.columns:
                    return t['Ticker'].tolist()
            return []
        except Exception as e2:
            print(f"Fallback Dow failed: {e2}")
            return []

def save_tickers(tickers):
    try:
        with open(TICKER_FILE, "w") as f:
            json.dump({"timestamp": str(datetime.datetime.now()), "tickers": tickers}, f)
    except Exception as e:
        print(f"Error saving cache: {e}")

def load_cached_tickers():
    if os.path.exists(TICKER_FILE):
        try:
            with open(TICKER_FILE, "r") as f:
                data = json.load(f)
                return data.get("tickers", [])
        except Exception:
            return []
    return []

def load_full_universe(force_refresh=False):
    """
    Loads tickers from cache if available, otherwise fetches from yahoo_fin/Wikipedia.
    Combines S&P 500, NASDAQ 100, and Dow.
    """
    if not force_refresh:
        cached = load_cached_tickers()
        if cached:
            print(f"Loaded {len(cached)} tickers from cache.")
            return cached

    print("Fetching new ticker list... (This may take a moment)")
    sp500 = get_sp500_tickers()
    nasdaq = get_nasdaq_tickers()
    dow = get_dow_tickers()
    
    # Combine and remove duplicates
    full_list = list(set(sp500 + nasdaq + dow))
    
    # Clean tickers (replace dots with hyphens for yfinance compatibility, e.g. BRK.B -> BRK-B)
    full_list = [t.replace('.', '-') for t in full_list]
    
    if full_list:
        save_tickers(full_list)
        print(f"Saved {len(full_list)} tickers to cache.")
    
    return full_list

if __name__ == "__main__":
    # Test run
    tickers = load_full_universe(force_refresh=True)
    print(f"Total Tickers: {len(tickers)}")
    print(f"Sample: {tickers[:10]}")
