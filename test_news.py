
import yfinance as yf
import json

def test_news():
    try:
        ticker = "AAPL"
        stock = yf.Ticker(ticker)
        news = stock.news
        print(f"News for {ticker}:")
        print(json.dumps(news, indent=2))
    except Exception as e:
        print(f"Error fetching news: {e}")

if __name__ == "__main__":
    test_news()
