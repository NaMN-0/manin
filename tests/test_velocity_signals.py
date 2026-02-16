import sys
import os
import pandas as pd
import numpy as np

# Add api to path
sys.path.append(os.path.join(os.getcwd(), 'api'))

from services.signals import detect_momentum_velocity

def test_vertical_velocity_signal():
    print("Testing Vertical Velocity Signal (0.35 -> 1.32 in 3 days)...")
    
    # Create mock DF
    # We need at least 10 rows for the function to run
    dates = pd.date_range(start="2026-01-20", periods=10)
    data = {
        'Close': [0.35] * 10,
        'Open': [0.35] * 10,
        'High': [0.36] * 10,
        'Low': [0.34] * 10,
        'Volume': [100000] * 10
    }
    df = pd.DataFrame(data, index=dates)
    
    # Simulate the jump
    # Jan 26: 0.35 (index 6 if we started 20th)
    # Jan 29: 1.32 (index 9)
    # The jump from 0.35 at index 6 (3 days ago from index 9) to 1.32 at index 9
    df.at[dates[9], 'Close'] = 1.32
    
    # 3-day ROC calculation: (current - prev_3d) / prev_3d
    # prev_3d is index 6 (9 - 3)
    # (1.32 - 0.35) / 0.35 = 2.7714 -> 277%
    
    result = detect_momentum_velocity(df)
    
    if result:
        print(f"Signals detected: {result['signals']}")
        print(f"Score: {result['score']}")
        print(f"Metrics: {result['velocity_metrics']}")
        
        if any("Vertical Move" in s for s in result['signals']):
            print("PASS: Vertical Move Detected")
        else:
            print("FAIL: Vertical Move NOT Detected")
            
        if result['velocity_metrics']['roc_3d'] > 270:
            print(f"PASS: Correct ROC_3D calculated: {result['velocity_metrics']['roc_3d']:.1f}%")
        else:
            print(f"FAIL: Incorrect ROC_3D: {result['velocity_metrics']['roc_3d']:.1f}%")
    else:
        print("FAIL: No result returned")

def test_parabolic_acceleration():
    print("\nTesting Parabolic Acceleration...")
    dates = pd.date_range(start="2026-01-20", periods=10)
    # Slow climb: 1.0 -> 1.05 -> 1.10 -> 1.30 (Fast jump today)
    closes = [1.0, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.08, 1.10, 1.35]
    df = pd.DataFrame({'Close': closes}, index=dates)
    
    result = detect_momentum_velocity(df)
    if result and "Parabolic Acceleration" in result['signals']:
        print("PASS: Parabolic Acceleration Detected")
    else:
        print(f"FAIL: Signal not found. Results: {result['signals'] if result else 'None'}")

if __name__ == "__main__":
    test_vertical_velocity_signal()
    test_parabolic_acceleration()
