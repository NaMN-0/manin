
import sys
import os

# Add e:\usstock\api to path
sys.path.append(r"e:\usstock\api")

# Mock services that might be missing or require DB
import services.cache_service
class MockCache:
    @staticmethod
    def get(*args, **kwargs): return None
    @staticmethod
    def set(*args, **kwargs): pass
services.cache_service.CacheService = MockCache

from services.news_service import NewsService

def test_service():
    tickers = ["AAPL", "TSLA", "UNKNOWN_TICKER_123"]
    print(f"Testing NewsService with: {tickers}")
    try:
        results = NewsService.analyze_tickers(tickers)
        for res in results:
            print(f"\nTicker: {res['ticker']}")
            print(f"Sentiment: {res['sentiment']} (Score: {res['sentimentScore']})")
            print(f"Headline: {res['headline']}")
            print(f"Outlook: {res['outlook']}")
    except Exception as e:
        print(f"Service Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_service()
