
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_market_overview():
    print("Testing /market/overview...")
    try:
        resp = requests.get(f"{BASE_URL}/market/overview")
        data = resp.json()
        if data['status'] == 'ok':
            print("✅ Market Overview OK")
            print(f"Commentary: {data['data'].get('commentary')}")
            # print(f"Indices Count: {len(data['data'].get('indices', []))}")
        else:
            print("❌ Market Overview Error:", data)
    except Exception as e:
        print("❌ Market Overview Request Failed:", e)

def test_smart_scan():
    print("\nTesting /market/smart-scan (Sector: Technology)...")
    try:
        resp = requests.get(f"{BASE_URL}/market/smart-scan", params={"sector": "Technology", "universe": "penny"})
        data = resp.json()
        if data['status'] == 'ok':
            print(f"✅ Smart Scan OK ({len(data['data']['candidates'])} candidates)")
            if data['data']['candidates']:
                print(f"Sample Candidate: {data['data']['candidates'][0]['ticker']}")
        else:
            print("❌ Smart Scan Error:", data)
    except Exception as e:
        print("❌ Smart Scan Request Failed:", e)

if __name__ == "__main__":
    test_market_overview()
    test_smart_scan()
