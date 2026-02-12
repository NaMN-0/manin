import streamlit as st
print("DEBUG: Streamlit imported")
import yfinance as yf
print("DEBUG: yfinance imported")
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
print("DEBUG: penny_loader imported")
import time
from datetime import datetime, time as dt_time
import pytz
print("DEBUG: All imports done")

# --- MOCK DATA ---
# Since fetching thousands of penny stocks live is slow, we use cache or live loader
import os

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

# --- 3. UI LAYOUT ---
st.title("🪙 Penny Stock Intelligence")
st.markdown("### AI-Powered Low Cap Analyzer")

# Sidebar Controls
st.sidebar.header("Configuration")
live_mode = st.sidebar.toggle("🔴 Pro Live Mode", value=False, help="Disables cache and projects volume for live signals.")

if st.button("Load Penny Universe"):
    with st.spinner("Fetching Universe..."):
        univ = load_universe()
        st.session_state['universe'] = univ
        print(f"DEBUG: Loaded universe with {len(univ)} tickers")
    st.success(f"Loaded {len(univ)} tickers.")

if 'universe' in st.session_state:
    univ = st.session_state['universe']
    
    # Batch Analysis
    col_act, col_sett = st.columns([1, 2])
    with col_act:
        run_btn = st.button(f"Start Smart Scan {'[LIVE]' if live_mode else ''}", type="primary")
    
    with col_sett:
        limit_scan = st.slider("Max Candidates to Analyze", 20, 500, 100)
        st.caption("ℹ️ First, we rapid-scan stocks in batches of 200. Then we deep-analyze the top volume ones.")
    
    if run_btn:
        print("DEBUG: Smart Scan Button Clicked")
        results = []
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        # 1. RAPID FILTERING PHASE
        status_text.text("Phase 1: Rapid Screening for Volume & Price (200/batch)...")
        print("DEBUG: Phase 1 Started")
        
        chunk_size = 200 # Increased batch size
        filtered_candidates = []
        
        universe_chunks = [univ[i:i + chunk_size] for i in range(0, len(univ), chunk_size)]
        print(f"DEBUG: Total chunks to process: {len(universe_chunks)}")
        
        for i, chunk in enumerate(universe_chunks):
            # print(f"DEBUG: Processing chunk {i+1}")
            passed = rapid_screen_batch(chunk)
            # print(f"DEBUG: Chunk {i+1} passed {len(passed)} tickers")
            filtered_candidates.extend(passed)
            progress_bar.progress((i + 1) / len(universe_chunks) * 0.3)
            
        st.success(f"Found {len(filtered_candidates)} candidates with Vol > 20k.")
        print(f"DEBUG: Total filtered candidates: {len(filtered_candidates)}")
        
        # Sort by Volume Descending (Ensure we look at the most active stocks from A-Z)
        filtered_candidates.sort(key=lambda x: x['vol'], reverse=True)
        
        # 2. DEEP ANALYSIS PHASE
        # Take the top N most liquid stocks
        targets = [x['ticker'] for x in filtered_candidates[:limit_scan]] 
        print(f"DEBUG: Targets for deep analysis: {targets}")
        
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
            # print(f"DEBUG: Analyzing {ticker}")
            df, pm = get_stock_data(ticker, live_mode=live_mode)
            
            if df is not None:
                res = analyze_penny(ticker, df, pm, market_progress=market_prog)
                if res: 
                    # Add to final results
                    results.append(res)
                    
                    # Update Live Top Picks
                    live_top_picks.append(res)
                    # Sort by Upside Potential live
                    live_top_picks.sort(key=lambda x: x['upside'], reverse=True)
                    # Keep Top 10
                    top_10_live = live_top_picks[:10]
                    
                    # Render Live Table
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
            
            
            # Map remaining progress (0.3 to 1.0)
            progress_bar.progress(0.3 + ((i + 1) / len(targets) * 0.7))
        
        status_text.empty()
        st.session_state['results'] = results

if 'results' in st.session_state:
    results = st.session_state['results']
    
    # Sorting Logic (Group by Profit First)
    # Primary Sort: Is Profitable (True on top)
    # Secondary Sort: Selected Metric
    
    sort_by = st.selectbox("Sort By", ["Prediction Upside", "Score", "Profit Margin", "Projected Volume"])
    
    def get_sort_key(x):
        # Tuple sorting: (Is Profitable desc, Chosen Metric desc)
        # We want True (1) before False (0) for profitability
        is_prof = 1 if x['is_profitable'] else 0
        
        metric = 0
        if sort_by == "Prediction Upside":
            metric = x['upside']
        elif sort_by == "Score":
            metric = x['score']
        elif sort_by == "Profit Margin":
            metric = x['margin']
        elif sort_by == "Projected Volume":
            metric = x['proj_volume']
            
        return (is_prof, metric)

    results.sort(key=get_sort_key, reverse=True)
        
    # Display in Groups
    st.markdown("---")
    st.markdown("### Final Analysis Results")
    
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
