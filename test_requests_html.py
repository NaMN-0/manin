try:
    from requests_html import HTMLSession
    print("requests_html imported successfully")
except ImportError as e:
    print(f"Error importing requests_html: {e}")
except Exception as e:
    print(f"Other error: {e}")
