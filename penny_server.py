import streamlit as st
print("DEBUG: Streamlit imported")
import yfinance as yf
print("DEBUG: yfinance imported")

# Fix for yfinance cache issue in containerized environments
try:
    yf.set_tz_cache_location("/tmp/yfinance_cache")
except Exception:
    pass
import pandas as pd
print("DEBUG: pandas imported")
import pandas_ta_classic as ta
print("DEBUG: pandas_ta imported")
import plotly.graph_objects as go
print("DEBUG: plotly imported")
import numpy as np
print("DEBUG: numpy imported")
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
print("DEBUG: sklearn imported")
import penny_loader
from penny_loader import get_penny_stocks, get_penny_sectors, get_random_tickers
print("DEBUG: penny_loader imported")
import time
from datetime import datetime, timedelta, time as dt_time
import pytz
import json
print("DEBUG: All imports done")

# --- MOCK DATA ---
# Since fetching thousands of penny stocks live is slow, we use cache or live loader
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='api/.env')

import warnings
warnings.filterwarnings('ignore')

# --- CONFIGURATION ---
st.set_page_config(layout="wide", page_title="Penny Stock Intelligence", page_icon="🪙")

st.success("✅ Server Connection Established! If you see this, the app is working.")

# Custom CSS for "Terminal" feel
st.markdown("""
<style>
    .stApp {
        background-color: #0e1117;
        color: #00ff00;
    }
    .stMetric {
        background-color: #161b22;
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #30363d;
    }
    h1, h2, h3 {
        color: #00ff41 !important;
        font-family: 'Courier New', Courier, monospace;
    }
    div[data-testid="stDataFrame"] {
        border: 1px solid #30363d;
    }
</style>
""", unsafe_allow_html=True)

# --- HELPER FUNCTIONS ---
def get_market_progress():
    """
    Returns the percentage of the trading day that has passed (0.0 to 1.0).
    Assumes NYSE market hours: 9:30 AM - 4:00 PM ET.
    """
    ny_tz = pytz.timezone('US/Eastern')
    now = datetime.now(ny_tz)
    
    market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
    market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)
    
    if now < market_open:
        return 0.0
    elif now > market_close:
        return 1.0
    
    total_duration = (market_close - market_open).total_seconds()
    elapsed = (now - market_open).total_seconds()
    return elapsed / total_duration

# --- 1. DATA ENGINE ---
@st.cache_data(ttl=3600)
def load_universe():
    return penny_loader.get_penny_stocks()

# Separate function for uncached live retrieval
def get_stock_data_live(ticker):
    return get_stock_data_impl(ticker)

# Cached function for historical analysis
@st.cache_data(ttl=600)
def get_stock_data_cached(ticker):
    return get_stock_data_impl(ticker)

def get_stock_data_impl(ticker):
    try:
        # Get data for 6 months for sufficient training data
        stock = yf.Ticker(ticker)
        # Verify if we get data, handle potential yfinance errors
        try:
            df = stock.history(period="6mo")
        except Exception:
            return None, None
        
        if df.empty or len(df) < 30:
            return None, None
            
        # Get Profit Margins (Fundamental)
        try:
             # Fast access if possible, or skip for speed if analyzing many
             info = stock.info
             profit_margin = info.get('profitMargins', 0)
             # Handle NoneType for profitMargins
             if profit_margin is None: profit_margin = 0
        except:
             profit_margin = 0 
             
        return df, profit_margin
    except Exception:
        return None, None

# Wrapper to choose between cached or live
def get_stock_data(ticker, live_mode=False):
    if live_mode:
        return get_stock_data_live(ticker)
    else:
        return get_stock_data_cached(ticker)

# --- 2. INTELLIGENCE ENGINE ---
def rapid_screen_batch(tickers):
    """
    Quickly screens a batch of tickers for basic viability:
    1. Price < $5 (Double check)
    2. Volume > 20,000 (Liquidity)
    Returns list of dicts: {'ticker': symbol, 'vol': volume}
    """
    try:
        # Increased thread count for larger batches
        data = yf.download(tickers, period="5d", group_by='ticker', threads=True, progress=False)
        passed = []
        
        if len(tickers) == 1:
             try:
                latest = data.iloc[-1]
                # Check for single-level columns if download returns series/dataframe differing structure
                # But typically with group_by='ticker'... wait, for single ticker it might not group.
                # data might be just a DF.
                if len(data) > 0:
                   p = float(latest['Close'])
                   v = float(latest['Volume'])
                   if p < 5.0 and v > 20000:
                       passed.append({'ticker': tickers[0], 'vol': v})
             except: pass
             return passed
             
        for ticker in tickers:
            try:
                if ticker not in data.columns.levels[0]: continue
                
                df = data[ticker]
                if df.empty: continue
                
                latest = df.iloc[-1]
                if pd.isna(latest['Close']) or pd.isna(latest['Volume']): continue
                
                p = float(latest['Close'])
                v = float(latest['Volume'])
                
                if p < 5.0 and v > 20000:
                    passed.append({'ticker': ticker, 'vol': v})
            except:
                continue
        return passed
    except:
        return []

# --- 2. INTELLIGENCE ENGINE ---
def analyze_penny(ticker, df, profit_margin, market_progress=1.0):
    # Flatten columns if MultiIndex
    if isinstance(df.columns, pd.MultiIndex):
        try:
            df.columns = df.columns.get_level_values(0)
        except: pass

    # 1. Technical Indicators
    try:
        df.ta.rsi(length=14, append=True)
        df.ta.sma(length=20, append=True)
        df.ta.sma(length=50, append=True)
        df.ta.bbands(length=20, std=2, append=True) # Bollinger Bands
        
        # Volume SMA
        df['Vol_SMA_20'] = df['Volume'].rolling(20).mean()
    except:
        return None

    # Get latest row
    latest = df.iloc[-1]
    
    # PROJECTED VOLUME LOGIC
    # If market is open (progress < 1.0), project end-of-day volume
    current_vol = latest['Volume']
    if 0.1 < market_progress < 1.0: # Avoid division by zero warnings early day
        projected_vol = current_vol / market_progress
    else:
        projected_vol = current_vol
        
    avg_vol = latest['Vol_SMA_20']
    
    # 2. Predictive Model (Linear Regression)
    try:
        data = df.copy()
        data['Target'] = data['Close'].shift(-1)
        data = data.dropna()
        
        feature_cols = ['Open', 'High', 'Low', 'Volume']
        if 'RSI_14' in data.columns: feature_cols.append('RSI_14')
        
        X = data[feature_cols]
        y = data['Target']
        
        model = LinearRegression()
        model.fit(X, y)
        
        latest_features = latest[feature_cols].values.reshape(1, -1)
        predicted_price = model.predict(latest_features)[0]
    except Exception:
        predicted_price = 0
        
    # 3. Signals
    signals = []
    score = 0
    
    # A. Volume Breakout (Using Projected Volume)
    vol_ratio = projected_vol / avg_vol if avg_vol > 0 else 0
    if vol_ratio > 2.0:
        signals.append(f"🚀 Massive Vol ({vol_ratio:.1f}x)")
        score += 2
    elif vol_ratio > 1.5:
        signals.append(f"🔥 High Vol ({vol_ratio:.1f}x)")
        score += 1
        
    # B. Trend (Price > SMA 20)
    if latest['Close'] > latest['SMA_20']:
        signals.append("📈 Above 20-SMA")
        score += 1
        
    # C. Squeeze (Bollinger Band width narrowing? - Simplified checklist here)
    if latest['Close'] > latest['BBU_20_2.0']:
        signals.append("⚠️ Upper BB Breakout")
    
    # D. Fundamental (Profit Margin)
    is_profitable = False
    if profit_margin > 0:
        is_profitable = True
        signals.append(f"💰 Profitable ({profit_margin*100:.1f}%)")
        score += 3 # High weight for profitability
    
    # 4. Momentum Velocity (New)
    try:
        current = df.iloc[-1]
        prev_1d = df.iloc[-2]
        prev_3d = df.iloc[-4] if len(df) >= 4 else df.iloc[0]
        
        roc_1d = (current['Close'] - prev_1d['Close']) / prev_1d['Close'] * 100
        roc_3d = (current['Close'] - prev_3d['Close']) / prev_3d['Close'] * 100
        
        if roc_3d > 100:
            signals.append(f"Vertical Move ({roc_3d:.0f}%)")
            score += 10
        elif roc_3d > 40:
            signals.append(f"High Velocity ({roc_3d:.0f}%)")
            score += 7
            
        if roc_1d > 15 and roc_1d > roc_3d / 2:
            signals.append("Parabolic Acceleration")
            score += 5
    except: pass

    return {
        "ticker": ticker,
        "price": latest['Close'],
        "predicted": predicted_price,
        "upside": ((predicted_price - latest['Close']) / latest['Close']) * 100,
        "margin": profit_margin,
        "is_profitable": is_profitable,
        "score": score,
        "signals": signals,
        "volume": current_vol,
        "proj_volume": projected_vol,
        "df": df
    }

def get_backtest_performance(ticker, backtest_date, hold_days=[1, 3, 5], pre_fetched_df=None):
    """
    Simulates a trade on backtest_date and checks performance after N days.
    """
    if pre_fetched_df is not None:
        df = pre_fetched_df
        # We also need profit margin, but pre-fetched might not have it
        # Try to get it from cache or just default to 0 for speed in mass backtest
        pm = 0 
    else:
        df, pm = get_stock_data(ticker, live_mode=False)
        
    if df is None or df.empty: return None
    
    # Slice up to backtest_date
    ts = pd.Timestamp(backtest_date)
    historical_df = df[df.index <= ts]
        
    if historical_df.empty or len(historical_df) < 20: return None
    
    # Run analysis as of that date
    res = analyze_penny(ticker, historical_df, pm)
    if not res: return None
    
    # Performance check
    entry_price = res['price']
    perf_results = {}
    
    future_df = df[df.index > ts]
    for d in hold_days:
        if len(future_df) >= d:
            exit_price = future_df.iloc[d-1]['Close']
            roi = ((exit_price - entry_price) / entry_price) * 100
            perf_results[f"{d}D"] = roi
        else:
            perf_results[f"{d}D"] = None
            
    res['performance'] = perf_results
    res['entry_date'] = historical_df.index[-1]
    res['full_df'] = df
    return res

# --- 3. UI LAYOUT ---
st.title("🪙 Penny Stock Intelligence")
st.markdown("### AI-Powered Low Cap Analyzer")

# Sidebar Controls
st.sidebar.header("Configuration")
live_mode = st.sidebar.toggle("🔴 Pro Live Mode", value=False, help="Disables cache and projects volume for live signals.")

if st.button("Load Penny Universe"):
    with st.spinner("Fetching Universe & Sectors..."):
        univ = load_universe()
        sectors = get_penny_sectors()
        st.session_state['universe'] = univ
        st.session_state['sector_map'] = sectors
        print(f"DEBUG: Loaded universe with {len(univ)} tickers")
    st.success(f"Loaded {len(univ)} tickers and sector maps.")

# TABS UI
# Tab Setup
tab_scan, tab_backtest, tab_ai_dojo = st.tabs(["🔍 Real-time Scanner", "🧪 Backtest Laboratory", "🧠 AI Learning Dojo"])

with tab_scan:
    run_btn = False
    if 'universe' in st.session_state:
        univ = st.session_state['universe']
        
        # Batch Analysis
        col_act, col_sett = st.columns([1, 2])
        with col_act:
            run_btn = st.button(f"Start Smart Scan {'[LIVE]' if live_mode else ''}", type="primary")
        
        with col_sett:
            limit_scan = st.slider("Max Candidates to Analyze", 20, 500, 100)
            min_conf_scan = st.slider("Min Confidence Score (Scan)", 0, 10, 3)
            st.caption("ℹ️ First, we rapid-scan stocks in batches of 200. Then we deep-analyze the top volume ones.")
    
        if run_btn:
            print("DEBUG: Smart Scan Button Clicked")
            results = []
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # 1. RAPID FILTERING PHASE
            status_text.text("Phase 1: Rapid Screening for Volume & Price (200/batch)...")
            print("DEBUG: Phase 1 Started")
            
            chunk_size = 200 
            filtered_candidates = []
            
            universe_chunks = [univ[i:i + chunk_size] for i in range(0, len(univ), chunk_size)]
            
            for i, chunk in enumerate(universe_chunks):
                passed = rapid_screen_batch(chunk)
                filtered_candidates.extend(passed)
                progress_bar.progress((i + 1) / len(universe_chunks) * 0.3)
                
            st.success(f"Found {len(filtered_candidates)} candidates with Vol > 20k.")
            
            # Sort by Volume Descending
            filtered_candidates.sort(key=lambda x: x['vol'], reverse=True)
            
            # 2. DEEP ANALYSIS PHASE
            # Take the top N most liquid stocks
            targets = [x['ticker'] for x in filtered_candidates[:limit_scan]] 
            
            status_text.text(f"Phase 2: Deep AI Analysis on top {len(targets)} most active candidates...")
            
            market_prog = get_market_progress()
            if live_mode:
                st.toast(f"Live Market Mode Active! Projecting volume based on {market_prog*100:.1f}% day completion.")
                
            # LIVE UPDATES CONTAINER
            st.divider()
            st.markdown("### 🔥 Live Top Picks (Updating...)")
            live_results_placeholder = st.empty()
            live_top_picks = []
            
            for i, ticker in enumerate(targets):
                status_text.text(f"Analyzing {ticker}...")
                df, pm = get_stock_data(ticker, live_mode=live_mode)
                
                if df is not None:
                    res = analyze_penny(ticker, df, pm, market_progress=market_prog)
                    if res and res['score'] >= min_conf_scan: 
                        results.append(res)
                        live_top_picks.append(res)
                        live_top_picks.sort(key=lambda x: x['upside'], reverse=True)
                        top_10_live = live_top_picks[:10]
                        
                        live_data = []
                        for pick in top_10_live:
                            live_data.append({
                                "Ticker": pick['ticker'],
                                "Price": f"${pick['price']:.2f}",
                                "Upside %": f"{pick['upside']:.1f}%",
                                "Score": pick['score'],
                                "Type": "💎 Gem" if pick['is_profitable'] else "🚀 High Vol"
                            })
                        
                        if live_data:
                            live_results_placeholder.dataframe(pd.DataFrame(live_data), use_container_width=True)
                
                progress_bar.progress(0.3 + ((i + 1) / len(targets) * 0.7))
            
            status_text.empty()
            st.session_state['results'] = results
    else:
        st.info("💡 Please click 'Load Penny Universe' to begin.")

if 'results' in st.session_state:
    results = st.session_state['results']
    
    # Sorting Logic (Group by Profit First)
    # Primary Sort: Is Profitable (True on top)
    # Secondary Sort: Selected Metric
    
    sort_by = st.selectbox("Sort By", ["Prediction Upside", "Score", "Velocity (3D ROC)", "Profit Margin", "Projected Volume"])
    
    def get_sort_key(x):
        # Tuple sorting: (Is Profitable desc, Chosen Metric desc)
        # We want True (1) before False (0) for profitability
        is_prof = 1 if x['is_profitable'] else 0
        
        metric = 0
        if sort_by == "Prediction Upside":
            metric = x['upside']
        elif sort_by == "Score":
            metric = x['score']
        elif sort_by == "Velocity (3D ROC)":
            # Extract ROC from signals if possible, or just use score weight
            metric = x['score'] if any("Velocity" in s or "Vertical" in s for s in x['signals']) else 0
        elif sort_by == "Profit Margin":
            metric = x['margin']
        elif sort_by == "Projected Volume":
            metric = x['proj_volume']
            
        return (is_prof, metric)

    results.sort(key=get_sort_key, reverse=True)
        
    # Display in Groups
    st.divider()
    st.markdown("### 📊 Scan Summary & Results")
    
    # Profitable Group
    profitable = [r for r in results if r['is_profitable']]
    speculative = [r for r in results if not r['is_profitable']]
    
    tab1, tab2 = st.tabs([f"💎 Profitable Gems ({len(profitable)})", f"🚀 Speculative / High Vol ({len(speculative)})"])
    
    with tab1:
        if not profitable:
            st.info("No profitable stocks found in this scan.")
        for res in profitable: 
             with st.container():
                c1, c2, c3, c4 = st.columns([1, 1, 2, 2])
                with c1:
                    st.subheader(f"{res['ticker']}")
                    st.caption(f"${res['price']:.2f}")
                with c2:
                    color = "green" if res['upside'] > 0 else "red"
                    st.markdown(f"**Pred:** ${res['predicted']:.2f}")
                    st.markdown(f"**Upside:** :{color}[{res['upside']:.1f}%]")
                with c3:
                    st.markdown("**Signals:**")
                    for s in res['signals']:
                        st.markdown(f"- {s}")
                with c4:
                    chart_data = res['df']['Close']
                    st.line_chart(chart_data, height=100)
                st.divider()

    with tab2:
        if not speculative:
            st.info("No speculative stocks found.")
        for res in speculative: 
             with st.container():
                c1, c2, c3, c4 = st.columns([1, 1, 2, 2])
                with c1:
                    st.subheader(f"{res['ticker']}")
                    st.caption(f"${res['price']:.2f}")
                with c2:
                    color = "green" if res['upside'] > 0 else "red"
                    st.markdown(f"**Pred:** ${res['predicted']:.2f}")
                    st.markdown(f"**Upside:** :{color}[{res['upside']:.1f}%]")
                with c3:
                    st.markdown("**Signals:**")
                    for s in res['signals']:
                        st.markdown(f"- {s}")
                with c4:
                    chart_data = res['df']['Close']
                    st.line_chart(chart_data, height=100)
                st.divider()

    # Raw Data
    st.markdown("### Raw Scan Data")
    df_res = pd.DataFrame(results)
    if not df_res.empty:
        st.dataframe(df_res[['ticker', 'price', 'predicted', 'upside', 'margin', 'score', 'volume', 'proj_volume']])

with tab_backtest:
    st.header("🧪 Strategy Stress Test")
    st.markdown("Select a past date and configuration to see how our engine would have performed.")
    
    col_bt1, col_bt2, col_bt3 = st.columns(3)
    with col_bt1:
        bt_date = st.date_input("Backtest Execution Date", value=datetime.now() - timedelta(days=7))
        confidence_thresh = st.slider("Min Confidence Score", 0, 10, 7)
    with col_bt2:
        sectors_to_test = st.multiselect("Target Sectors", options=["All", "Technology", "Healthcare", "Financial", "Energy", "Consumer Cyclical", "Industrials", "Communication Services"], default=["All"])
        batch_size_bt = st.select_slider("Backtest Batch Size", options=[10, 25, 50, 100, 200], value=50)
    with col_bt3:
        if 'bt_offset' not in st.session_state: st.session_state['bt_offset'] = 0
        st.write(f"Current Offset: {st.session_state['bt_offset']}")
        run_bt_btn = st.button("🚀 Run Backtest Batch", type="primary", use_container_width=True)
        if st.button("🔄 Reset Backtest", use_container_width=True):
            st.session_state['bt_offset'] = 0
            st.session_state['bt_results'] = []
            st.rerun()

    if run_bt_btn:
        if 'universe' not in st.session_state or 'sector_map' not in st.session_state:
            st.error("Please load the Penny Universe first.")
        else:
            univ = st.session_state['universe']
            s_map = st.session_state['sector_map']
            
            # Map sectors
            sector_groups = {}
            for t in univ:
                s = s_map.get(t, {}).get('sector', 'Unknown')
                if s not in sector_groups: sector_groups[s] = []
                sector_groups[s].append(t)
            
            # Filter and Flatten Tickers logic
            selected_sectors = list(sector_groups.keys()) if "All" in sectors_to_test else [s for s in sectors_to_test if s in sector_groups]
            all_target_tickers = []
            for s in selected_sectors:
                all_target_tickers.extend(sector_groups[s])
            
            # Apply Offset
            offset = st.session_state['bt_offset']
            current_batch_tickers = all_target_tickers[offset : offset + batch_size_bt]
            
            if not current_batch_tickers:
                st.warning("No more tickers to analyze in this range.")
            else:
                st.info(f"Analyzing Batch: {offset} to {offset + len(current_batch_tickers)} ({len(all_target_tickers)} total)")
                
                # OPTIMIZED: Batch Download History
                with st.spinner(f"Phase 1/2: Downloading history for {len(current_batch_tickers)} tickers..."):
                    try:
                        # Fetch 6 months of data for all
                        batch_data = yf.download(current_batch_tickers, period="6mo", group_by='ticker', threads=True, progress=False)
                    except Exception as e:
                        st.error(f"YFinance Batch Download Error: {e}")
                        batch_data = None

                # Phase 2: Analyze
                bt_results = st.session_state.get('bt_results', [])
                progress_bt = st.progress(0)
                status_bt = st.empty()
                
                new_signals_count = 0
                
                for i, ticker in enumerate(current_batch_tickers):
                    status_bt.text(f"Analyzing {ticker}...")
                    
                    # Extract single DF from batch
                    ticker_df = None
                    if batch_data is not None:
                        try:
                            if len(current_batch_tickers) == 1:
                                ticker_df = batch_data
                            else:
                                ticker_df = batch_data[ticker]
                        except: pass
                    
                    res = get_backtest_performance(ticker, bt_date, pre_fetched_df=ticker_df)
                    if res and res['score'] >= confidence_thresh:
                        bt_results.append(res)
                        new_signals_count += 1
                        
                    progress_bt.progress((i + 1) / len(current_batch_tickers))

                st.session_state['bt_results'] = bt_results
                st.session_state['bt_offset'] = offset + batch_size_bt
                
                if new_signals_count > 0:
                    st.success(f"Batch Complete! Found {new_signals_count} new high-confidence signals.")
                else:
                    st.info("Batch Complete. No new signals met the confidence threshold.")
                st.rerun()

if 'bt_results' in st.session_state and st.session_state['bt_results']:
    bt_results = st.session_state['bt_results']
    
    # Summary Metrics
    m1, m2, m3 = st.columns(3)
    m1.metric("Signals Found", len(bt_results))
    
    profitable_5d = [r for r in bt_results if r['performance'].get('5D') and r['performance'].get('5D') > 0]
    m2.metric("Profitable (5D)", f"{(len(profitable_5d)/len(bt_results)*100):.1f}%" if bt_results else "0%")
    
    avg_roi = sum([r['performance'].get('5D', 0) for r in bt_results if r['performance'].get('5D')]) / len(bt_results) if bt_results else 0
    m3.metric("Avg ROI (5D)", f"{avg_roi:.1f}%")

    st.markdown("### Detailed Backtest Results")
    # Live Results Table
    bt_table_data = []
    for r in bt_results:
        bt_table_data.append({
            "Ticker": r['ticker'],
            "Score": r['score'],
            "Signals": ", ".join(r['signals'][:2]),
            "1D": f"{r['performance'].get('1D', 0):.1f}%" if r['performance'].get('1D') else "N/A",
            "5D": f"{r['performance'].get('5D', 0):.1f}%" if r['performance'].get('5D') else "N/A"
        })
    st.dataframe(pd.DataFrame(bt_table_data), use_container_width=True)
    
    for res in bt_results[-10:]: # Show last 10 in detail
        with st.expander(f"{res['ticker']} - Score: {res['score']} | 5D ROI: {res['performance'].get('5D', 0):.2f}%", expanded=False):
            c1, c2 = st.columns([2, 1])
            with c1:
                st.write("**Signal Details:**")
                st.write(", ".join(res['signals']))
                st.write("**Performance Breakdown:**")
                perf_df = pd.DataFrame([res['performance']])
                st.table(perf_df)
            with c2:
                # Reality Chart
                entry_p = res['price']
                full_df = res['full_df']
                chart_df = full_df[full_df.index >= res['entry_date'] - timedelta(days=5)].head(15)
                st.line_chart(chart_df['Close'], height=150)
                st.caption(f"Entry Price: ${entry_p:.2f} on {res['entry_date'].date()}")

with tab_ai_dojo:
    st.header("🧠 AI Learning Dojo")
    st.markdown("Iterative discovery and strategy mapping. Fetch random batches to teach the AI what's working.")
    
    col_ai1, col_ai2 = st.columns([1, 2])
    with col_ai1:
        batch_size_ai = st.select_slider("AI Training Batch Size", options=[10, 20, 30, 50], value=20)
        fetch_ai_btn = st.button("🚀 Fetch Random Batch", type="primary", use_container_width=True)
        if st.button("🧹 Reset Dojo Knowledge", use_container_width=True):
            st.session_state['ai_knowledge'] = []
            st.session_state['strategy_map'] = {}
            st.rerun()
            
    if fetch_ai_btn:
        random_tickers = get_random_tickers(batch_size_ai)
        st.info(f"Retrieved {len(random_tickers)} random tickers. Learning starts...")
        
        # Knowledge storage
        if 'ai_knowledge' not in st.session_state: st.session_state['ai_knowledge'] = []
        if 'strategy_map' not in st.session_state: st.session_state['strategy_map'] = {}
        
        progress_ai = st.progress(0)
        for i, ticker in enumerate(random_tickers):
            # For Dojo, we analyze with 3-day future prediction perspective
            df, pm = get_stock_data(ticker, live_mode=True)
            if df is not None and not df.empty:
                res = analyze_penny(ticker, df, pm)
                if res:
                    # Simple Trend Projection for "Future Stars"
                    sma_slope = (df['SMA_20'].iloc[-1] - df['SMA_20'].iloc[-5]) / df['SMA_20'].iloc[-5] if 'SMA_20' in df.columns and len(df) > 20 else 0
                    # Arbitrary learning heuristic
                    predicted_gain = (res['score'] / 10) * 0.15 + (sma_slope * 2) 
                    res['predicted_future_roi'] = predicted_gain * 100
                    res['predicted_price'] = res['price'] * (1 + predicted_gain)
                    
                    st.session_state['ai_knowledge'].append(res)
                    
                    # Map Strategy Success
                    for signal in res['signals']:
                        if signal not in st.session_state['strategy_map']:
                            st.session_state['strategy_map'][signal] = {"count": 0, "stars": 0}
                        st.session_state['strategy_map'][signal]["count"] += 1
                        if res['predicted_future_roi'] > 10:
                            st.session_state['strategy_map'][signal]["stars"] += 1
            
            progress_ai.progress((i + 1) / len(random_tickers))
        st.success("Learning Batch Processed!")
        st.rerun()

    if 'ai_knowledge' in st.session_state and st.session_state['ai_knowledge']:
        knowledge = st.session_state['ai_knowledge']
        s_map = st.session_state.get('strategy_map', {})
        
        # Strategy Rankings
        st.divider()
        st.markdown("### 🔥 Strategy Heatmap")
        map_cols = st.columns(4) if s_map else []
        sorted_strats = sorted(s_map.items(), key=lambda x: x[1]['stars']/x[1]['count'] if x[1]['count'] > 0 else 0, reverse=True)
        for i, (strat, stats) in enumerate(sorted_strats[:4]):
            with map_cols[i % 4]:
                success_rate = (stats['stars'] / stats['count'] * 100) if stats['count'] > 0 else 0
                st.metric(strat, f"{success_rate:.0f}% Hot", help=f"Stars found using this pattern: {stats['stars']}/{stats['count']}")

        # Future Stars
        st.markdown("### ⭐ Predicted Future Stars (>10% Profit)")
        stars = [r for r in knowledge if r['predicted_future_roi'] > 10]
        if not stars:
            st.warning("No future stars found in this knowledge base yet. Keep searching!")
        else:
            star_df_data = []
            for s in stars:
                star_df_data.append({
                    "Ticker": s['ticker'],
                    "Current": f"${s['price']:.2f}",
                    "Predicted": f"${s['predicted_price']:.2f}",
                    "ROI": f"{s['predicted_future_roi']:.1f}%",
                    "Score": s['score'],
                    "Patterns": ", ".join(s['signals'][:2])
                })
            st.dataframe(pd.DataFrame(star_df_data), use_container_width=True)
            
            # Star Cards
            card_cols = st.columns(3)
            for i, star in enumerate(stars[-6:]): # Show last 6 found
                with card_cols[i % 3]:
                    with st.container(border=True):
                        st.markdown(f"#### {star['ticker']}")
                        st.write(f"**Predicted: {star['predicted_future_roi']:.1f}%**")
                        st.write(f"Confidence: {star['score']}/10")
                        st.line_chart(star['df']['Close'].tail(30), height=120)
