import streamlit as st
import yfinance as yf
import pandas as pd
import os
import gc
import sys
from datetime import datetime, timedelta
import time
import market_loader
import penny_loader
from dotenv import load_dotenv

# Fix for yfinance cache issue in containerized environments
try:
    yf.set_tz_cache_location("/tmp/yfinance_cache")
except Exception:
    pass

# Lazy load expensive libraries only when needed
# import pandas_ta_classic as ta
# import plotly.graph_objects as go
# from textblob import TextBlob
# from GoogleNews import GoogleNews

load_dotenv(dotenv_path='api/.env')

# --- CONFIGURATION ---
st.set_page_config(layout="wide", page_title="Market Insight Engine [PRO]", page_icon="⚡")

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
def get_data(ticker, end_date=None):
    try:
        # Download last 6 months of data
        # If backtesting, we might need a bit more to show "What Happened Next"
        period = "6mo"
        df = yf.download(ticker, period=period, interval="1d", progress=False, auto_adjust=False)
        
        if df.empty:
            return None
            
        # Fix MultiIndex columns
        if isinstance(df.columns, pd.MultiIndex):
            try:
                if df.columns.nlevels > 1:
                     df.columns = df.columns.get_level_values(0)
            except IndexError:
                pass

        df = optimize_dataframe(df)
        
        if end_date:
            # Slice up to the end_date for current analysis
            # But we keep the full DF for "Reality" check later
            return df
        return df
    except Exception as e:
        return None

def slice_df_to_date(df, target_date):
    """
    Slices a dataframe up to (and including) the target_date.
    target_date should be a datetime.date or datetime.datetime object.
    """
    if df is None or df.empty:
        return df
    
    # Ensure index is datetime
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)
        
    # Convert target_date to datetime at end of day
    ts = pd.Timestamp(target_date)
    return df[df.index <= ts]

# --- 2. SENTIMENT ENGINE ---
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_sentiment(ticker):
    try:
        # Lazy import
        from GoogleNews import GoogleNews
        from textblob import TextBlob

        googlenews = GoogleNews(period='7d')
        googlenews.search(f"{ticker} stock news")
        result = googlenews.result()
        if not result:
            return 0.15, ["Bullish technical setup detected (No recent news catalyst found)."]
        
        polarities = []
        headlines = []
        for item in result[:5]: # Analyze top 5 news items
            blob = TextBlob(item['title'])
            polarities.append(blob.sentiment.polarity)
            headlines.append(item['title'])
            
        avg_polarity = sum(polarities) / len(polarities) if polarities else 0
        return avg_polarity, headlines
    except Exception as e:
        # Fallback to a very basic sentiment if scraping fails
        return 0.1, ["No recent news found, volume catalyst detected."]

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

# --- 4. NEW: SCANNER ENGINES ---
def quick_screen(tickers_batch, min_price=5.0, max_price=None, end_date=None):
    """
    Screens based on price and volume.
    """
    try:
        # If backtesting, we need to download specific range or download period that covers it
        if end_date:
            end_ts = pd.Timestamp(end_date) + pd.Timedelta(days=1)
            start_ts = end_ts - pd.Timedelta(days=15) # Fetch enough for 5d lookback
            data = yf.download(tickers_batch, start=start_ts.strftime('%Y-%m-%d'), end=end_ts.strftime('%Y-%m-%d'), group_by='ticker', threads=True, progress=False)
        else:
            data = yf.download(tickers_batch, period="5d", group_by='ticker', threads=True, progress=False)
        
        passed_tickers = []
        
        # Helper to check a single DF
        def check_ticker(df, ticker):
            if df.empty: return False
            if end_date:
                df = slice_df_to_date(df, end_date)
            if df.empty: return False
            
            try:
                latest = df.iloc[-1]
                if pd.isna(latest['Close']): return False
                
                price = latest['Close']
                volume = latest['Volume']
                
                if price < min_price: return False
                if max_price and price > max_price: return False
                
                if volume > 500000:
                    return True
            except: pass
            return False

        if len(tickers_batch) == 1:
            if check_ticker(data, tickers_batch[0]):
                passed_tickers.append(tickers_batch[0])
        else:
            for ticker in tickers_batch:
                try:
                    if check_ticker(data[ticker], ticker):
                        passed_tickers.append(ticker)
                except: continue
        
        del data
        gc.collect()
        return passed_tickers
    except: return []

def scan_volatility_setup(tickers_batch, min_price=5.0, max_price=None, end_date=None):
    """
    "Coiled Spring" Logic with price params.
    """
    try:
        if end_date:
            end_ts = pd.Timestamp(end_date) + pd.Timedelta(days=1)
            start_ts = end_ts - pd.Timedelta(days=30) # Fetch enough for 10d lookback + indicators
            data = yf.download(tickers_batch, start=start_ts.strftime('%Y-%m-%d'), end=end_ts.strftime('%Y-%m-%d'), group_by='ticker', threads=True, progress=False)
        else:
            data = yf.download(tickers_batch, period="10d", group_by='ticker', threads=True, progress=False)
            
        candidates = []
        
        def check_setup(df, ticker):
            if df.empty: return False
            if end_date:
                df = slice_df_to_date(df, end_date)
            if df.empty or len(df) < 5: return False
            
            latest = df.iloc[-1]
            price = latest['Close']
            
            # Price constraints
            if price < min_price: return False
            if max_price and price > max_price: return False
            
            # 1. Volatility / Big Move Check
            pct_changes = df['Close'].pct_change().tail(5)
            max_gain = pct_changes.max()
            
            if max_gain < 0.05: return False # Need some life
                
            # 2. Consolidation
            high_5d = df['High'].tail(5).max()
            if price < (high_5d * 0.85): # Relaxed to 15% drop allowed for pennies/volatility
                return False
                
            # 3. Volume Heat
            avg_vol = df['Volume'].tail(10).mean()
            if avg_vol == 0: return False
            rvol = latest['Volume'] / avg_vol
            
            if rvol > 1.2: return True
            return False

        if len(tickers_batch) == 1:
            if check_setup(data, tickers_batch[0]):
                candidates.append(tickers_batch[0])
        else:
            for ticker in tickers_batch:
                try:
                    if check_setup(data[ticker], ticker):
                        candidates.append(ticker)
                except: continue
                
        del data
        gc.collect()
        return candidates
    except Exception as e:
        return []

# --- 5. THE INTERFACE ---
# st.set_page_config was moved to top
st.title("⚡ Market Insight Engine [PRO]")

# Sidebar Strategy Selection
st.sidebar.header("Backtest Mode")
is_backtest = st.sidebar.toggle("🕰️ Enable Backtest (Rewind Time)", value=False)
backtest_date = None
if is_backtest:
    backtest_date = st.sidebar.date_input("Historical Scan Date", value=datetime.now() - timedelta(days=7))
    eval_window = st.sidebar.slider("Evaluation Window (Days)", 1, 14, 5)
    st.sidebar.warning(f"Engine will scan as if today were {backtest_date}. Performance window: {eval_window} days.")

st.sidebar.header("Strategy Settings")
# Default to Intraday Momentum (Index 1)
strategy = st.sidebar.radio("Strategy Mode", ["Classic Swing (Trend)", "Intraday Momentum (Predictive)"], index=1)

st.sidebar.header("Market Universe")
# Default to Penny Stocks (Index 1)
universe_option = st.sidebar.selectbox(
    "Select Universe",
    ("Tech Giants (Default)", "Penny Stocks (Under $2)", "S&P 500", "NASDAQ 100", "Dow 30", "Full Market"),
    index=1
)

# Load Tickers based on selection
if universe_option == "Tech Giants (Default)":
    TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'AMZN', 'GOOGL', 'META', 'NFLX', 'INTC', 'PLTR', 'SOFI']
elif universe_option == "Penny Stocks (Under $2)":
    with st.spinner("Loading Penny Stocks (< $2)..."):
        # Use penny_loader to get filtered list
        # We fetch up to $2.00
        TICKERS = penny_loader.get_penny_stocks(max_price=2.0)
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
    if st.sidebar.button("Load Full Universe"):
         with st.spinner("Loading Full Market..."):
            all_tickers = market_loader.load_full_universe()
            TICKERS = all_tickers
    else:
        TICKERS = []
        st.info("Click button to load.")

# Auto-Discovery / Alphabet Filter
import random
if 'random_letter' not in st.session_state:
    st.session_state['random_letter'] = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

filter_mode = st.sidebar.radio("Discovery Mode", ["⚡ Auto-Discovery (Smart Loop)", "🔤 Manual Alphabet Filter"])

if filter_mode == "⚡ Auto-Discovery (Smart Loop)":
    # Show current letter
    letter = st.session_state['random_letter']
    st.sidebar.info(f"Scanning Sector: **'{letter}'**")
    
    if st.sidebar.button("🎲 Scan Next Batch (Random)", type="primary"):
        st.session_state['random_letter'] = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        st.rerun()
        
    # Filter Tickers
    TICKERS = [t for t in TICKERS if t.startswith(letter)]
else:
    # Manual Mode
    start_letter = st.sidebar.selectbox("Filter by Starting Letter", ["All"] + list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))
    if start_letter != "All":
        TICKERS = [t for t in TICKERS if t.startswith(start_letter)]

st.write(f"**Strategy:** {strategy} | **Universe:** {len(TICKERS)} stocks | **Mode:** {filter_mode}")

# Auto-Start for Pro Feel (or big button)
if st.button("🚀 Start Analysis Engine", type="primary"):
    if not TICKERS:
        st.error(f"No tickers found starting with '{st.session_state['random_letter']}' in this universe. Try Next Batch.")
    else:
        results = []
        candidates = TICKERS
        
        # Determine constraints based on universe
        is_penny_mode = universe_option == "Penny Stocks (Under $2)"
        min_p = 0.0 if is_penny_mode else 5.0
        max_p = 2.0 if is_penny_mode else None
        
        # --- PHASE 1: SCANNING ---
        st.info(f"Phase 1: Smart-Scanning {len(TICKERS)} stocks for '{strategy}' patterns...")
        progress_bar = st.progress(0)
        
        if len(TICKERS) > 20:
            batch_size = 50
            filtered = []
            total = (len(TICKERS) + batch_size - 1) // batch_size
            
            for i, idx in enumerate(range(0, len(TICKERS), batch_size)):
                batch = TICKERS[idx:idx+batch_size]
                
                if strategy == "Classic Swing (Trend)":
                    passed = quick_screen(batch, min_price=min_p, max_price=max_p, end_date=backtest_date)
                else:
                    passed = scan_volatility_setup(batch, min_price=min_p, max_price=max_p, end_date=backtest_date)
                    
                filtered.extend(passed)
                progress_bar.progress(min((i+1)/total, 1.0))
                time.sleep(0.05)
            candidates = filtered
        else:
            progress_bar.progress(1.0)
            
        st.success(f"Found {len(candidates)} candidates matching '{strategy}' patterns.")
        
        # --- PHASE 2: DEEP ANALYSIS ---
        st.info("Phase 2: Deep AI Analysis & Sentiment Check...")
        
        # Cap for performance
        candidates = candidates[:20] 
        
        status_placeholder = st.empty()
        for i, ticker in enumerate(candidates):
            status_placeholder.info(f"Analyzing {ticker} ({i+1}/{len(candidates)})...")
            df_full = get_data(ticker, end_date=backtest_date)
            if df_full is not None:
                # Slice for analysis
                if is_backtest:
                    df = slice_df_to_date(df_full, backtest_date)
                else:
                    df = df_full
                
                # Use shared analysis logic but interpret differently based on strategy
                analysis = analyze_stock(df, ticker)
                
                if analysis:
                    sent_score, headlines = get_sentiment(ticker)
                    
                    # Custom Scoring for Momentum
                    if strategy == "Intraday Momentum (Predictive)":
                        # Boost score for Volatility Compression + News
                        mom_score = 0
                        # 1. News Catalyst
                        if sent_score > 0.1: mom_score += 2
                        
                        # 2. Technical Breakout Potential
                        if analysis['rsi_bullish']: mom_score += 1
                        if analysis['volume_bullish']: mom_score += 2 # Heavy weighting on volume
                        
                        analysis['score'] = mom_score # Override score
                        analysis['details'].append(f"🔥 Momentum Score: {mom_score}/5")
                    
                    # --- PERFORMANCE CALCULATION (Backtest Only) ---
                    actual_return = 0.0
                    accuracy_status = "N/A"
                    if is_backtest and df_full is not None:
                        try:
                            # --- MULTI-WINDOW ROI BENCHMARKING ---
                            entry_price = analysis['latest']['Close']
                            entry_idx = df_full.index.get_indexer([pd.Timestamp(backtest_date)], method='pad')[0]
                            
                            multi_window_results = {}
                            for w in [1, 2, 3, 4, 5]:
                                target_idx = entry_idx + w
                                if target_idx >= len(df_full):
                                    t_idx = len(df_full) - 1
                                else:
                                    t_idx = target_idx
                                
                                ex_price = df_full.iloc[t_idx]['Close']
                                roi = ((ex_price - entry_price) / entry_price) * 100
                                multi_window_results[f"{w}D"] = roi
                            
                            # Use selected eval_window for primary metrics (backward compatibility)
                            main_target_idx = entry_idx + eval_window
                            if main_target_idx >= len(df_full): main_target_idx = len(df_full) - 1
                            
                            exit_price = df_full.iloc[main_target_idx]['Close']
                            actual_return = ((exit_price - entry_price) / entry_price) * 100
                            window_end_date = df_full.index[main_target_idx]
                            
                            # Best Window for this stock
                            best_w_val = max(multi_window_results.values())
                            best_w_name = [k for k, v in multi_window_results.items() if v == best_w_val][0]
                            
                            # Heuristic for accuracy:
                            # If score >= 3 (predicted bullish) and actual return > 0% -> SUCCESS
                            # If score < 3 (not bullish) and actual return <= 0% -> SUCCESS (avoided loss)
                            predicted_bullish = analysis['score'] >= 3
                            if predicted_bullish:
                                accuracy_status = "✅ PREDICTION CORRECT" if actual_return > 0 else "❌ FALSE POSITIVE"
                            else:
                                accuracy_status = "✅ AVOIDED LOSS" if actual_return <= 0 else "⚠️ MISSED OPPORTUNITY"
                        except: pass

                    results.append({
                        "ticker": ticker,
                        "analysis": analysis,
                        "sentiment": sent_score,
                        "headlines": headlines,
                        "df": df,
                        "df_full": df_full if is_backtest else None,
                        "actual_return": actual_return,
                        "accuracy_status": accuracy_status,
                        "window_end_date": window_end_date if is_backtest else None,
                        "multi_window_roi": multi_window_results if is_backtest else None,
                        "best_window": best_w_name if is_backtest else None
                    })
            
            if i % 10 == 0: gc.collect()
        
        status_placeholder.empty()
        st.session_state['results'] = results
        st.session_state['last_analysis_mode_backtest'] = is_backtest
        st.rerun() # Rerun to display persisted results

# --- DISPLAY RESULTS (Outside of button block for persistence) ---
if 'results' in st.session_state:
    results = st.session_state['results']
    # Use the mode that was active when results were generated
    results_is_backtest = st.session_state.get('last_analysis_mode_backtest', False)
    
    st.markdown("---")
    
    # Sorting Logic (Group by Score)
    results.sort(key=lambda x: x['analysis']['score'], reverse=True)
    
    if not results:
        st.warning("No high-probability setups found.")
    else:
        # --- BENCHMARKING OVERVIEW (Backtest Only) ---
        if results_is_backtest:
            with st.expander("📊 Multi-Window Benchmarking Overview", expanded=True):
                bench_data = []
                for res in results:
                    row = {"Ticker": res['ticker'], "Score": f"{res['analysis']['score']}/5"}
                    row.update({k: f"{v:.2f}%" for k, v in res['multi_window_roi'].items()})
                    row["Best Window"] = res['best_window']
                    bench_data.append(row)
                
                st.table(pd.DataFrame(bench_data))
                st.caption("ROI across different hold periods (Trading Days). Best Window highlights where peak gain occurred.")

        # TOP 3 HIGHLIGHT (Curated)
        st.subheader("🏆 Top 3 Predictive Picks (Most Likely to Run)")
        cols = st.columns(3)
        for idx, res in enumerate(results[:3]):
            with cols[idx]:
                st.success(f"#{idx+1} {res['ticker']}")
                
                # Backtest Accuracy Metrics
                if results_is_backtest:
                     st.metric("Backtest Result", f"{res['actual_return']:.2f}%", f"Score: {res['analysis']['score']}/5")
                     # accuracy_status is colored by status
                     color = "green" if "CORRECT" in res['accuracy_status'] or "AVOIDED" in res['accuracy_status'] else "red"
                     st.markdown(f"**Status:** :{color}[{res['accuracy_status']}]")
                else:
                     st.metric("Score", f"{res['analysis']['score']}/5", f"Sent: {res['sentiment']:.2f}")
                
                st.write(f"**Catalyst:** {res['headlines'][0] if res['headlines'] else 'Volume Breakout'}")
                if strategy == "Intraday Momentum (Predictive)":
                    st.caption("🚀 Coiled Spring Setup")
        
        st.divider()
        
        # Full List
        st.subheader("📋 Full Watchlist")
        
        # Lazy import Plotly
        import plotly.graph_objects as go
        
        for res in results:
            ticker = res['ticker']
            analysis = res['analysis']
            
            with st.container():
                c1, c2, c3 = st.columns([1, 2, 1])
                with c1:
                    st.subheader(ticker)
                    try:
                        curr = analysis['latest']['Close']
                        st.write(f"**${curr:.2f}**")
                    except: pass
                    
                with c2:
                    st.write("**Analysis:**")
                    for d in analysis['details']:
                        st.markdown(f"- {d}")
                    
                    if results_is_backtest:
                        color = "green" if res['actual_return'] > 0 else "red"
                        st.markdown(f"**Performance Since Scan:** :{color}[{res['actual_return']:.2f}%] ({res['accuracy_status']})")
                    
                with c3:
                     # Mini Chart
                    try:
                        plot_df = res['df']
                        if not isinstance(plot_df.index, pd.DatetimeIndex):
                            plot_df.index = pd.to_datetime(plot_df.index)
                        
                        if results_is_backtest and res.get('df_full') is not None:
                            # Dual Graph for Backtest
                            tab_pred, tab_real = st.tabs(["🔮 Prediction View", "📉 Reality Check"])
                            with tab_pred:
                                fig = go.Figure(data=[go.Candlestick(x=plot_df.index,
                                                open=plot_df['Open'], high=plot_df['High'],
                                                low=plot_df['Low'], close=plot_df['Close'])])
                                fig.update_layout(height=180, margin=dict(t=0, b=0, l=0, r=0), xaxis_rangeslider_visible=False)
                                st.plotly_chart(fig, use_container_width=True)
                                st.caption(f"Show data up to {backtest_date}")
                            
                            with tab_real:
                                df_real = res['df_full']
                                # Only show from backtest_date onwards (plus a bit of context before)
                                start_context = pd.Timestamp(backtest_date) - pd.Timedelta(days=5)
                                df_real_show = df_real[df_real.index >= start_context]
                                
                                fig2 = go.Figure(data=[go.Candlestick(x=df_real_show.index,
                                                open=df_real_show['Open'], high=df_real_show['High'],
                                                low=df_real_show['Low'], close=df_real_show['Close'])])
                                # Add a vertical line for the backtest date
                                fig2.add_vline(x=pd.Timestamp(backtest_date).timestamp() * 1000, line_width=2, line_dash="dash", line_color="green")
                                
                                # Highlight the entry point and current point
                                entry_ts = res['df'].index[-1] # Actual last candle of slice
                                entry_price = analysis['latest']['Close']
                                fig2.add_trace(go.Scatter(x=[entry_ts], y=[entry_price], mode='markers', name='Entry', marker=dict(size=12, color='yellow', symbol='star')))
                                
                                current_ts = df_real_show.index[-1]
                                current_price = df_real_show.iloc[-1]['Close']
                                fig2.add_trace(go.Scatter(x=[current_ts], y=[current_price], mode='markers', name='Today', marker=dict(size=8, color='cyan', symbol='x')))

                                # Show the window end date
                                if res.get('window_end_date'):
                                    wend = pd.Timestamp(res['window_end_date'])
                                    fig2.add_vline(x=wend.timestamp() * 1000, line_width=1, line_dash="dot", line_color="orange")
                                    fig2.add_trace(go.Scatter(x=[wend], y=[res['df_full'].loc[wend, 'Close'] if wend in res['df_full'].index else exit_price], 
                                                            mode='markers', name='Window End', marker=dict(size=12, color='white', symbol='diamond')))

                                fig2.update_layout(height=220, margin=dict(t=0, b=0, l=0, r=0), xaxis_rangeslider_visible=False, showlegend=False)
                                st.plotly_chart(fig2, use_container_width=True)
                                st.caption(f"Yellow Star = Scan | White Diamond = {eval_window}-Day Target | Return: {res['actual_return']:.1f}%")
                        else:
                            # Standard View
                            fig = go.Figure(data=[go.Candlestick(x=plot_df.index,
                                            open=plot_df['Open'], high=plot_df['High'],
                                            low=plot_df['Low'], close=plot_df['Close'])])
                            fig.update_layout(height=150, margin=dict(t=0, b=0, l=0, r=0), xaxis_rangeslider_visible=False)
                            st.plotly_chart(fig, use_container_width=True)
                    except Exception as e: 
                        st.error(f"Chart Error: {e}")
                st.divider()
