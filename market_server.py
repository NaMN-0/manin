import streamlit as st
import yfinance as yf
import pandas as pd
import os
import gc
import sys
from datetime import datetime, timedelta
import time
import market_loader
from dotenv import load_dotenv

# Lazy load expensive libraries only when needed
# import pandas_ta_classic as ta
# import plotly.graph_objects as go
# from textblob import TextBlob
# from GoogleNews import GoogleNews

load_dotenv(dotenv_path='api/.env')

# --- CONFIGURATION ---
st.set_page_config(layout="wide", page_title="Market Insight Engine")

# --- MEMORY OPTIMIZATION ---
def optimize_dataframe(df):
    """
    Downcast float64 to float32 to save memory.
    Drop unused columns if possible.
    """
    if df is None or df.empty:
        return df
    
    # Keep only necessary columns for analysis if we were to be strict,
    # but pandas_ta might need Open/High/Low/Close/Volume/Adj Close.
    # So we just downcast floats.
    fcols = df.select_dtypes('float').columns
    df[fcols] = df[fcols].astype('float32')
    return df

# --- 1. DATA INGESTION ENGINE ---
@st.cache_data(ttl=300) 
def get_data(ticker):
    try:
        # Download last 6 months of data
        # auto_adjust=True often simplifies column maps (Open, High, Low, Close, Volume)
        df = yf.download(ticker, period="6mo", interval="1d", progress=False, auto_adjust=False)
        
        if df.empty:
            return None
            
        # Fix MultiIndex columns if present (common in new yfinance)
        if isinstance(df.columns, pd.MultiIndex):
            try:
                # If the top level is Ticker, drop it.
                # If headers are Price, Ticker -> distinct
                # Usually yf.download(..., group_by='ticker') vs default
                # basic download of single ticker often has (Price, Ticker) or just Price
                if df.columns.nlevels > 1:
                     df.columns = df.columns.get_level_values(0)
            except IndexError:
                pass

        df = optimize_dataframe(df)
        return df
    except Exception as e:
        # print(f"Error fetching {ticker}: {e}") # Reduce log noise
        return None

# --- 2. SENTIMENT ENGINE ---
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_sentiment(ticker):
    try:
        # Lazy import
        from GoogleNews import GoogleNews
        from textblob import TextBlob

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
    # Lazy import
    import pandas_ta_classic as ta

    # Ensure columns are flat (fix for some yfinance versions)
    if isinstance(df.columns, pd.MultiIndex):
        try:
            df.columns = df.columns.get_level_values(0)
        except IndexError:
            pass
            
    # Copy to avoid SettingWithCopy on cached data if it wasn't a deep copy
    # But usually we want to modify a local version.
    # Since we return a dict with 'latest', we might not need to copy full DF if we are careful,
    # but pandas_ta appends to the DF.
    # To be safe and avoid mutating cached dataframe:
    df = df.copy()

    # Calculate Indicators using pandas_ta
    try:
        # Timeout/Memory protection: TA can be heavy on very large DFs, but 6mo is small.
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
        
        # Explicit garbage collection after batch processing
        del data
        gc.collect()
        
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
    st.sidebar.warning("⚠️ Full Market scan is very slow and may hit memory limits!")
    if st.sidebar.button("Load Full Universe (Risk of Timeout)"):
         with st.spinner("Loading Full Market (~3000+ tickers)..."):
            # Limit full market load primarily
            all_tickers = market_loader.load_full_universe()
            # Safety cap for free tier
            TICKERS = all_tickers
            st.warning(f"Loaded {len(TICKERS)} tickers. Consider simpler universe for speed.")
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
        
        # Only run quick scan if we have enough tickers to warrant it
        if universe_option == "Full Market" or len(TICKERS) > 20:
            st.info("Phase 1: Running Quick Scan (Price > $5, Vol > 500k)...")
            progress_bar_scan = st.progress(0)
            batch_size = 50 # Reduced from potentially larger batches
            filtered_candidates = []
            
            total_batches = (len(TICKERS) + batch_size - 1) // batch_size
            
            for i, idx_start in enumerate(range(0, len(TICKERS), batch_size)):
                batch = TICKERS[idx_start:idx_start+batch_size]
                passed = quick_screen(batch)
                filtered_candidates.extend(passed)
                
                # Update progress
                progress = (i + 1) / total_batches
                progress_bar_scan.progress(min(progress, 1.0))
                
                # Sleep briefly to yield CPU
                time.sleep(0.05)
            
            candidates = filtered_candidates
            st.success(f"Quick Scan Complete. Found {len(candidates)} candidates.")
        
        # Phase 2: Deep Analysis
        st.info(f"Phase 2: Deep Technical Analysis on {len(candidates)} stocks...")
        progress_bar_analysis = st.progress(0)
        
        # Hard limit on how many deep analyses we run to prevent timeout/OOM
        MAX_DEEP_ANALYSIS = 50
        if len(candidates) > MAX_DEEP_ANALYSIS:
            st.warning(f"Capping deep analysis to top {MAX_DEEP_ANALYSIS} candidates to preserve resources.")
            candidates = candidates[:MAX_DEEP_ANALYSIS]

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
                        "df": df # Note: Keeping DF in memory for plotting
                    })
            
            progress_bar_analysis.progress((i + 1) / len(candidates))
            
            # Frequent GC
            if i % 10 == 0:
                gc.collect()
        
        st.markdown("---")
        
        # Sort results by score (most bullish first)
        results.sort(key=lambda x: x['analysis']['score'], reverse=True)
        
        if not results:
            st.warning("No stocks matched the criteria.")
        
        # Lazy import Plotly
        import plotly.graph_objects as go
        
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
                        # use Get to avoid key error if iloc-2 doesn't exist (though guarded in analyze)
                        prev_close = res['df'].iloc[-2]['Close']
                        curr_close = analysis['latest']['Close']
                        pct_change = ((curr_close - prev_close)/prev_close * 100)
                        st.metric("Price", f"${curr_close:.2f}", f"{pct_change:.2f}%")
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
                    try:
                        # Ensure index is datetime for proper plotting
                        plot_df = res['df']
                        if not isinstance(plot_df.index, pd.DatetimeIndex):
                            plot_df.index = pd.to_datetime(plot_df.index)
                            
                        fig = go.Figure(data=[go.Candlestick(x=plot_df.index,
                                        open=plot_df['Open'],
                                        high=plot_df['High'],
                                        low=plot_df['Low'],
                                        close=plot_df['Close'])])
                        fig.update_layout(height=200, margin=dict(l=0, r=0, t=0, b=0), xaxis_rangeslider_visible=False)
                        st.plotly_chart(fig, use_container_width=True)
                    except Exception as e:
                        st.error("Chart Error")
                
                st.divider()
