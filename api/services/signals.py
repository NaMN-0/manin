import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def check_structure_liquidity(df: pd.DataFrame, lookback: int = 3) -> dict:
    """
    Detects Structure & Liquidity setups (Sweep & Reclaim).
    Adapted from AlphaSuite's StructureLiquidityScanner.
    
    Returns:
        dict: {'signal': str, 'score': int} or None
    """
    try:
        if len(df) < (lookback * 2) + 10:
            return None

        # Calculate Swings
        highs = df['High']
        lows = df['Low']
        
        # Simple rolling max/min to find swing points (roughly)
        # In a real scanner we'd look forward/back, but for live analysis we look back
        # We'll use a simplified Pivot High/Low detection
        
        # Identify pivot points (High > surrounding highs, Low < surrounding lows)
        # We need to shift to avoid lookahead bias if we were backtesting, 
        # but here we are analyzing past data up to now.
        
        # Logic: Find the most recent confirmed swing low/high before the current candle
        # This is computationally expensive to do perfectly in pandas without a loop or complex mask
        # We will use a simplified approach: Rolling Min/Max of previous N candles
        
        current_row = df.iloc[-1]
        current_close = current_row['Close']
        current_low = current_row['Low']
        current_high = current_row['High']
        
        # Check previous N days (excluding today)
        prev_df = df.iloc[:-1]
        
        recent_low = prev_df['Low'].tail(20).min()
        recent_high = prev_df['High'].tail(20).max()
        
        # Support/Resistance levels (simplified last major swing)
        # A true swing analysis requires more code, using recent min/max is a proxy for "Liquidity Zone"
        
        signals = []
        score = 0
        
        # Long: Sweep Low & Reclaim
        # Price went below recent low but closed above it
        if current_low < recent_low and current_close > recent_low:
             signals.append("Liquidity Sweep (Bullish)")
             score += 5
             
        # Short: Sweep High & Reclaim
        # Price went above recent high but closed below it
        elif current_high > recent_high and current_close < recent_high:
             signals.append("Liquidity Sweep (Bearish)")
             score += 5 # Magnitude, direction handled by caller context if needed

        if signals:
            return {"signals": signals, "score": score}
            
    except Exception as e:
        logger.error(f"Error in check_structure_liquidity: {e}")
    
    return None


def check_wyckoff_spring(df: pd.DataFrame) -> dict:
    """
    Detects Wyckoff Spring patterns.
    Adapted from AlphaSuite's WyckoffSpringScanner.
    """
    try:
        if len(df) < 50:
            return None

        current = df.iloc[-1]
        
        # Support Level: Lowest low of previous 20-60 days (excluding last few days)
        # to ensure we establish a range
        lookback_start = -60
        lookback_end = -2 
        
        if len(df) < abs(lookback_start):
             return None
             
        range_window = df['Low'].iloc[lookback_start:lookback_end]
        support_level = range_window.min()
        
        # Spring Criteria:
        # 1. Low pierces support
        # 2. Close recovers above support
        # 3. Low Volume (relative to avg)
        
        is_spring = (current['Low'] < support_level) and (current['Close'] > support_level)
        
        if is_spring:
            # Check Volume
            avg_vol = df['Volume'].iloc[-20:-1].mean()
            if avg_vol > 0:
                vol_ratio = current['Volume'] / avg_vol
                if vol_ratio < 1.2: # Low volume test
                    return {"signals": ["Wyckoff Spring"], "score": 5}
                    
    except Exception as e:
        logger.error(f"Error in check_wyckoff_spring: {e}")

    return None
