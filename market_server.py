import streamlit as st
import yfinance as yf
import pandas as pd
import pandas_ta_classic as ta
import plotly.graph_objects as go
from datetime import datetime, timedelta
from textblob import TextBlob
from GoogleNews import GoogleNews
import time
import market_loader
from dotenv import load_dotenv

load_dotenv(dotenv_path='api/.env')

# --- CONFIGURATION ---
st.set_page_config(layout="wide", page_title="Market Insight Engine")

# --- 1. DATA INGESTION ENGINE ---
@st.cache_data(ttl=300) 
def get_data(ticker):
    try:
        # Download last 6 months of data
        df = yf.download(ticker, period="6mo", interval="1d", progress=False)
        if df.empty:
            return None
        return df
    except Exception as e:
        # print(f"Error fetching {ticker}: {e}") # Reduce log noise
        return None

# --- 2. SENTIMENT ENGINE ---
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_sentiment(ticker):
    try:
        googlenews = GoogleNews(period='7d')
        googlenews.search(f"{ticker} stock")
        result = googlenews.result()
        if not result:
            return 0, []
        
        polarities = []
        headlines = []
        for item in result[:5]: # Analyze top 5 news items
            blob = TextBlob(item['title'])
            polarities.append(blob.sentiment.polarity)
            headlines.append(item['title'])
            
        avg_polarity = sum(polarities) / len(polarities) if polarities else 0
        return avg_polarity, headlines
    except Exception as e:
        # print(f"Error fetching sentiment for {ticker}: {e}")
        return 0, []

# --- 3. THE STRATEGY ENGINE (The "Brain") ---
def analyze_stock(df, ticker):
    # Ensure columns are flat (fix for some yfinance versions)
    if isinstance(df.columns, pd.MultiIndex):
        try:
            df.columns = df.columns.get_level_values(0)
        except IndexError:
            pass

    # Calculate Indicators using pandas_ta
    try:
        df.ta.rsi(length=14, append=True)
        df.ta.sma(length=50, append=True) # Trend
        df.ta.sma(length=200, append=True) # Long Trend
        # Calculate Volume SMA (often not standard in basic examples but useful)
        # Using a 20-day SMA for volume
        df['VOL_SMA_20'] = df['Volume'].rolling(window=20).mean()
        
        df.ta.macd(append=True)
    except Exception as e:
        return None # Not enough data for indicators
    
    # Get the latest data point
    try:
        latest = df.iloc[-1]
        prev = df.iloc[-2]
    except IndexError:
        return None

    # Strategy Logic (Bullish Setup)
    # 1. Trend: Price > 50 SMA
    try:
        trend_bullish = latest['Close'] > latest['SMA_50']
    except KeyError:
        trend_bullish = False
    
    # 2. Momentum: RSI between 50 and 70
    try:
        rsi_bullish = 50 < latest['RSI_14'] < 70
    except KeyError:
        rsi_bullish = False
    
    # 3. Volume: Current volume > 100% of 20-day average volume
    # Note: 'Current volume' might be partial if live, so be careful. 
    # Logic: latest volume > latest VOL_SMA_20
    try:
        volume_bullish = latest['Volume'] > latest['VOL_SMA_20']
    except KeyError:
        volume_bullish = False

    # 4. MACD: MACD line > Signal line (Bullish Crossover or alignment)
    # standard names in pandas_ta: MACD_12_26_9, MACDs_12_26_9, MACDh_12_26_9
    try:
        macd_val = latest['MACD_12_26_9']
        signal_val = latest['MACDs_12_26_9']
        macd_bullish = macd_val > signal_val
    except KeyError:
        macd_bullish = False # Default to False if indicator missing

    score = sum([trend_bullish, rsi_bullish, volume_bullish, macd_bullish])
    
    reasoning = []
    if trend_bullish: reasoning.append("✅ Price above 50-day SMA (Upward Trend)")
    else: reasoning.append("❌ Price below 50-day SMA")
            
    if rsi_bullish: reasoning.append("✅ RSI between 50-70 (Strong Momentum)")
    else: reasoning.append(f"⚠️ RSI is {latest.get('RSI_14', 0):.2f}")

    if volume_bullish: reasoning.append("✅ Volume surge (>20-day avg)")
    else: reasoning.append("⚠️ Volume not significant")

    if macd_bullish: reasoning.append("✅ MACD > Signal (Bullish Momentum)")
    else: reasoning.append("⚠️ MACD < Signal")
    
    return {
        "score": score,
        "details": reasoning,
        "latest": latest,
        "trend_bullish": trend_bullish,
        "rsi_bullish": rsi_bullish,
        "volume_bullish": volume_bullish,
        "macd_bullish": macd_bullish
    }

# --- 4. NEW: QUICK SCANNER ENGINE ---
def quick_screen(tickers_batch):
    """
    Rapidly screens a batch of tickers for basic viability:
    1. Price > $5 (Penny stock filter)
    2. Volume > 500k (Liquidity)
    3. Positive momentum (optional)
    """
    try:
        # Download minimal data for speed (last 5 days is enough for vol/price check)
        # Using threads=True for parallel downloading logic within yfinance
        data = yf.download(tickers_batch, period="5d", group_by='ticker', threads=True, progress=False)
        
        passed_tickers = []
        
        # Handle single ticker case vs multi-ticker case structure in yfinance
        if len(tickers_batch) == 1:
            ticker = tickers_batch[0]
            df = data
            if df.empty: return []
            try:
                latest = df.iloc[-1]
                price = latest['Close']
                volume = latest['Volume']
                if price > 5 and volume > 500000:
                    passed_tickers.append(ticker)
            except Exception:
                pass
            return passed_tickers

        # Multi-ticker case
        for ticker in tickers_batch:
            try:
                df = data[ticker]
                if df.empty: continue
                
                latest = df.iloc[-1]
                # Check for NaN values
                if pd.isna(latest['Close']) or pd.isna(latest['Volume']):
                    continue
                    
                price = latest['Close']
                volume = latest['Volume']
                
                # Rule 1: Not a penny stock (User requested filtered out for now)
                # Rule 2: Minimum Liquidity
                if price > 5 and volume > 500000:
                    passed_tickers.append(ticker)
            except Exception:
                continue
                
        return passed_tickers
    except Exception as e:
        print(f"Batch download error: {e}")
        return []

# --- 5. THE INTERFACE ---
st.title("⚡ Smart US Stock Market Analyser")
st.markdown("### The Insight Engine | Swing Trading Setup")

# Sidebar Controls
st.sidebar.header("Market Universe")
universe_option = st.sidebar.selectbox(
    "Select Universe",
    ("Tech Giants (Default)", "S&P 500", "NASDAQ 100", "Dow 30", "Full Market")
)

# Load Tickers based on selection
if universe_option == "Tech Giants (Default)":
    TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'AMZN', 'GOOGL', 'META', 'NFLX', 'INTC', 'PLTR', 'SOFI']
elif universe_option == "S&P 500":
    with st.spinner("Loading S&P 500..."):
        TICKERS = market_loader.get_sp500_tickers()
elif universe_option == "NASDAQ 100":
    with st.spinner("Loading NASDAQ..."):
        TICKERS = market_loader.get_nasdaq_tickers()
elif universe_option == "Dow 30":
    with st.spinner("Loading Dow 30..."):
        TICKERS = market_loader.get_dow_tickers()
elif universe_option == "Full Market":
    st.sidebar.warning("⚠️ Full Market scan is very slow!")
    if st.sidebar.button("Load Full Universe"):
         with st.spinner("Loading Full Market (~3000+ tickers)..."):
            TICKERS = market_loader.load_full_universe()
    else:
        TICKERS = []
        st.info("Click button in sidebar to load full universe.")

st.write(f"**Monitoring Universe Size:** {len(TICKERS)} stocks")

if st.button("Start Analysis"):
    if not TICKERS:
        st.error("No tickers loaded. Please select a universe.")
    else:
        results = []
        
        # Phase 1: Quick Scan (if universe is large)
        candidates = TICKERS
        if len(TICKERS) > 20:
            st.info("Phase 1: Running Quick Scan (Price > $5, Vol > 500k)...")
            progress_bar_scan = st.progress(0)
            batch_size = 50
            filtered_candidates = []
            
            total_batches = (len(TICKERS) + batch_size - 1) // batch_size
            
            for i in range(0, len(TICKERS), batch_size):
                batch = TICKERS[i:i+batch_size]
                passed = quick_screen(batch)
                filtered_candidates.extend(passed)
                progress_bar_scan.progress((i + batch_size) / len(TICKERS) if (i + batch_size) < len(TICKERS) else 1.0)
            
            candidates = filtered_candidates
            st.success(f"Quick Scan Complete. Found {len(candidates)} candidates.")
        
        # Phase 2: Deep Analysis
        st.info(f"Phase 2: Deep Technical Analysis on {len(candidates)} stocks...")
        progress_bar_analysis = st.progress(0)
        
        for i, ticker in enumerate(candidates):
            # Fetch full history for deep analysis (indicators need history)
            df = get_data(ticker)
            if df is not None:
                analysis = analyze_stock(df, ticker)
                if analysis: # Ensure analysis was successful
                    sentiment_score, headlines = get_sentiment(ticker)
                    
                    # Only add if score is decent (optional filter for cleaner UI)
                    # or keep all for transparency
                    results.append({
                        "ticker": ticker,
                        "analysis": analysis,
                        "sentiment": sentiment_score,
                        "headlines": headlines,
                        "df": df
                    })
            progress_bar_analysis.progress((i + 1) / len(candidates))
        
        st.markdown("---")
        
        # Sort results by score (most bullish first)
        results.sort(key=lambda x: x['analysis']['score'], reverse=True)
        
        if not results:
            st.warning("No stocks matched the criteria.")
        
        for res in results:
            ticker = res['ticker']
            analysis = res['analysis']
            score = analysis['score']
            
            # Display Card
            with st.container():
                col1, col2, col3 = st.columns([1, 2, 1])
                
                with col1:
                    st.subheader(f"{ticker}")
                    # Safe percentage calculation
                    try:
                        pct_change = ((analysis['latest']['Close'] - res['df'].iloc[-2]['Close'])/res['df'].iloc[-2]['Close']*100)
                        st.metric("Price", f"${analysis['latest']['Close']:.2f}", f"{pct_change:.2f}%")
                    except Exception:
                         st.metric("Price", f"${analysis['latest']['Close']:.2f}", "0.00%")
                    
                    if score == 4:
                        st.success("STRONG BUY SIGNAL 🚀")
                    elif score == 3:
                        st.warning("WATCHLIST (Potential Buy) 👀")
                    else:
                        st.info("NEUTRAL / WAIT ✋")

                with col2:
                    st.write("**Technical Reasoning:**")
                    for reason in analysis['details']:
                        st.markdown(reason)
                    
                    st.write("**Sentiment Analysis:**")
                    sent_emoji = "😐"
                    if res['sentiment'] > 0.1: sent_emoji = "😁 (Positive)"
                    elif res['sentiment'] < -0.1: sent_emoji = "😡 (Negative)"
                    st.write(f"News Sentiment: {sent_emoji} ({res['sentiment']:.2f})")

                with col3:
                    # Plotly Mini Chart
                    # Fix for Plotly Candlestick which needs flat index
                    try:
                        fig = go.Figure(data=[go.Candlestick(x=res['df'].index,
                                        open=res['df']['Open'],
                                        high=res['df']['High'],
                                        low=res['df']['Low'],
                                        close=res['df']['Close'])])
                        fig.update_layout(height=200, margin=dict(l=0, r=0, t=0, b=0), xaxis_rangeslider_visible=False)
                        st.plotly_chart(fig, use_container_width=True)
                    except Exception as e:
                        st.error("Chart Error")
                
                st.divider()

