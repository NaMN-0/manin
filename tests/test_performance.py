
import sys
import os
import time
import asyncio

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))

from api.services.penny_service import run_batch_scan, run_full_scan

async def test_batch_scan():
    print("Testing run_batch_scan(limit=5)...")
    start = time.time()
    results = run_batch_scan(limit=5, offset=0)
    end = time.time()
    print(f"Batch Scan took {end - start:.2f}s")
    print(f"Found {len(results)} results")
    if results:
        print(f"Sample: {results[0]['ticker']} - Score: {results[0]['score']}")

if __name__ == "__main__":
    # asyncio.run(test_batch_scan()) # run_batch_scan is synchronous internally
    # But wait, earlier I saw it was synchronous def.
    # Let's check definition.
    # def run_batch_scan(limit: int = 10, offset: int = 0) -> list:
    # It is synchronous.
    
    try:
        print("Testing run_batch_scan(limit=5)...")
        start = time.time()
        results = run_batch_scan(limit=5, offset=0)
        end = time.time()
        print(f"Batch Scan took {end - start:.2f}s")
        print(f"Found {len(results)} results")
        if results:
            print(f"Sample: {results[0]['ticker']} - Score: {results[0]['score']}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
