import sys
import os
import pandas as pd
import numpy as np

# Add api to path
sys.path.append(os.path.join(os.getcwd(), 'api'))

from services.signals import check_structure_liquidity, check_wyckoff_spring

def test_structure_liquidity():
    print("Testing Structure Liquidity...")
    # Create mock DF
    data = {
        'Open': [10] * 50,
        'High': [11] * 50,
        'Low': [9] * 50,
        'Close': [10] * 50,
        'Volume': [1000] * 50
    }
    df = pd.DataFrame(data)
    
    # Simulate a liquidity sweep setup
    # 1. Establish a low (e.g., at index 40, Low=8) which is lower than recent lows
    df.at[40, 'Low'] = 8.0 
    
    # 2. Current bar (index 49) sweeps that low (Low=7.8) but closes above (Close=8.5)
    df.at[49, 'Low'] = 7.8
    df.at[49, 'Close'] = 8.5
    
    # We need to make sure the "recent_low" logic in the function picks up the 8.0
    # The function looks at tail(20) of prev_df.
    
    result = check_structure_liquidity(df)
    if result and "Liquidity Sweep (Bullish)" in result['signals']:
        print("PASS: Bullish Sweep Detected")
    else:
        print(f"FAIL: Bullish Sweep NOT Detected. Result: {result}")

def test_wyckoff_spring():
    print("\nTesting Wyckoff Spring...")
    # Mock DF
    data = {
        'Open': [10] * 100,
        'High': [11] * 100,
        'Low': [9] * 100,
        'Close': [10] * 100,
        'Volume': [100000] * 100
    }
    df = pd.DataFrame(data)
    
    # 1. Establish support level
    df.loc[20:80, 'Low'] = 8.5 # Support
    
    # 2. Last bar springs
    last_idx = 99
    df.at[last_idx, 'Low'] = 8.0 # Pierce support
    df.at[last_idx, 'Close'] = 8.7 # Recover
    
    # 3. Low volume on spring
    df.at[last_idx, 'Volume'] = 10000 # Low volume
    
    result = check_wyckoff_spring(df)
    if result and "Wyckoff Spring" in result['signals']:
        print("PASS: Wyckoff Spring Detected")
    else:
        print(f"FAIL: Wyckoff Spring NOT Detected. Result: {result}")

if __name__ == "__main__":
    try:
        test_structure_liquidity()
        test_wyckoff_spring()
        print("\nAll Tests Completed.")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
