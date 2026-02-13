import yfinance as yf

try:
    ticker = yf.Ticker("AAPL")
    news = ticker.news
    if news:
        item = news[0]
        content = item.get('content', {})
        title = content.get('title') or item.get('title', '')
        print(f"Extracted Title: {title}")
    else:
        print("No news found")
except Exception as e:
    print(e)
