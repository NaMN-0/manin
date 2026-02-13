
import requests
import os

key_id = "rzp_live_SFJ7FpFTrrJgME"
key_secret = "ywzJp5rhTSMZ5JkYearrcgJ4"

try:
    url = "https://api.razorpay.com/v1/orders"
    response = requests.get(url, auth=(key_id, key_secret), params={"count": 1}, timeout=10)

    print(f"Status: {response.status_code}")
    # print(f"Body: {response.text}") # Don't print full body to avoid clutter
except Exception as e:
    print(f"Error: {e}")
