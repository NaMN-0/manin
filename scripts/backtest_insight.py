import sys
import os
import argparse
import pandas as pd
from datetime import datetime, timedelta

# Add api to path
sys.path.append(os.path.join(os.getcwd(), 'api'))

import yfinance as yf
from services.penny_service import _deep_analyze

def run_backtest(ticker, target_date, timeline=False):
    print(f"--- Historical Backtest: {ticker} ---")
    
    stock = yf.Ticker(ticker)
    df = stock.history(period="6mo")
    
    if df.empty:
        print(f"Error: No data found for {ticker}")
        return

    # Flatten columns
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    target_ts = pd.Timestamp(target_date).tz_localize(df.index.tz)
    
    if target_ts not in df.index:
        # Find closest preceding date
        available_dates = df.index[df.index <= target_ts]
        if available_dates.empty:
            print(f"Error: Target date {target_date} is too far in the past.")
            return
        target_ts = available_dates[-1]
        print(f"Adjusting to closest available market date: {target_ts.date()}")

    if timeline:
        print(f"Scanning timeline leading up to {target_ts.date()}...")
        # Get last 20 market days
        idx = df.index.get_loc(target_ts)
        start_idx = max(0, idx - 20)
        
        results = []
        for i in range(start_idx, idx + 1):
            current_date = df.index[i]
            sub_df = df.iloc[:i+1]
            
            # Use the existing _deep_analyze logic (we need to bypass some API calls for speed in tests)
            # Actually, _deep_analyze takes a ticker and hits YF itself.
            # To backtest correctly, we'd need to mock YF or modify _deep_analyze.
            # For this tool, we will run the core signal logic directly.
            
            from services.signals import detect_momentum_velocity, check_structure_liquidity, check_wyckoff_spring
            
            signals_data = []
            
            vel = detect_momentum_velocity(sub_df)
            if vel: signals_data.extend(vel['signals'])
            
            liq = check_structure_liquidity(sub_df)
            if liq: signals_data.extend(liq['signals'])
            
            if signals_data:
                results.append({
                    "Date": current_date.date(),
                    "Price": round(sub_df.iloc[-1]['Close'], 2),
                    "Signals": ", ".join(signals_data)
                })
        
        if results:
            timeline_df = pd.DataFrame(results)
            print("\nSignal Evolution Timeline:")
            print(timeline_df.to_string(index=False))
        else:
            print("No signals detected in the specified range.")
    else:
        # Single day deep analysis
        # We simulate the state of the world on that day
        sub_df = df[df.index <= target_ts]
        
        from services.signals import detect_momentum_velocity, check_structure_liquidity, check_wyckoff_spring
        
        print(f"\nAnalysis for {target_ts.date()}:")
        print(f"Close Price: ${sub_df.iloc[-1]['Close']:.2f}")
        
        signals = []
        vel = detect_momentum_velocity(sub_df)
        if vel: signals.extend(vel['signals'])
        
        liq = check_structure_liquidity(sub_df)
        if liq: signals.extend(liq['signals'])
        
        if signals:
            print(f"Signals Found: {', '.join(signals)}")
            if vel:
                m = vel['velocity_metrics']
                print(f"Velocity Metrics: 1D: {m['roc_1d']:.1f}% | 3D: {m['roc_3d']:.1f}% | 5D: {m['roc_5d']:.1f}%")
        else:
            print("Verdict: No significant signals detected on this day.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backtest AI signals for a specific ticker and date.")
    parser.add_argument("--ticker", required=True, help="Stock ticker (e.g. AAPL)")
    parser.add_argument("--date", required=True, help="Target date (YYYY-MM-DD)")
    parser.add_argument("--timeline", action="store_true", help="Show signal evolution for the preceding 20 days.")
    
    args = parser.parse_args()
    run_backtest(args.ticker, args.date, args.timeline)
