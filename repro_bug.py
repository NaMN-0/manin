
import sys
import os
# Add the project root to sys.path
sys.path.append(os.path.abspath("e:/usstock/api"))

from services.market_service import get_smart_batch
import yfinance as yf

# Mock yfinance to simulate issues if needed, but first let's try direct call
try:
    print("Testing with letter 'A'...")
    res = get_smart_batch(letter="A")
    print("Success!")
except UnboundLocalError as e:
    print(f"FAILED with UnboundLocalError: {e}")
except Exception as e:
    print(f"Failed with other error: {e}")

try:
    print("\nTesting with sector 'Technology'...")
    res = get_smart_batch(sector="Technology")
    print("Success!")
except UnboundLocalError as e:
    print(f"FAILED with UnboundLocalError: {e}")
except Exception as e:
    print(f"Failed with other error: {e}")
