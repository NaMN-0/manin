import yfinance as yf
import json

try:
    ticker = yf.Ticker("AAPL")
    news = ticker.news
    if news:
        print("Keys:", news[0].keys())
        print("Title:", news[0].get('title'))
        if 'content' in news[0]:
            print("Content Keys:", news[0]['content'].keys())
            print("Content Title:", news[0]['content'].get('title'))
    else:
        print("No news found")
except Exception as e:
    print(e)
