import requests
import json
import pandas as pd
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def test_nasdaq():
    url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=25&offset=0&download=true"
    try:
        r = requests.get(url, headers=HEADERS)
        r.raise_for_status()
        data = r.json()
        # The structure is usually data['data']['rows']
        rows = data.get('data', {}).get('rows', [])
        print(f"Fetched {len(rows)} rows.")
        if rows:
            print(f"Sample: {rows[0]}")
            # Check keys
            print(f"Keys: {rows[0].keys()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_nasdaq()
