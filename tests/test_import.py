import sys
import os

# Add api to path
sys.path.append(os.path.join(os.getcwd(), 'api'))

print("Importing penny_service...")
try:
    from services import penny_service
    print("SUCCESS: penny_service imported.")
except ImportError as e:
    print(f"FAIL: ImportError: {e}")
except Exception as e:
    print(f"FAIL: Exception: {e}")
