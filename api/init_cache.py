
import os
import sys
from supabase import create_client, Client

# Add parent directory to path so we can import local modules if needed
sys.path.insert(0, os.path.dirname(__file__))

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not set.")
    sys.exit(1)

supabase: Client = create_client(url, key)

def create_cache_table():
    print("Attempting to create/verify 'cache' table...")
    
    # We can't run DDL via the JS client easily unless we use RPC or just try to insert a dummy row to check existence.
    # But since we might have the service key, let's try a direct SQL execution via RPC if a function exists, 
    # or just rely on the user having created it. 
    # Actually, the user's "out of the box" request implies *I* should do it.
    
    # Plan B: We can't create tables via standard Supabase client comfortably without SQL Editor or proper migrations.
    # However, we can try to use the REST API to check if it exists.
    
    try:
        # Try to select from the table
        supabase.table("cache").select("*").limit(1).execute()
        print("Table 'cache' exists.")
    except Exception as e:
        print(f"Table 'cache' might not exist or verify failed: {e}")
        print("Please ensure the following SQL is run in your Supabase SQL Editor:")
        print("""
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value JSONB,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

if __name__ == "__main__":
    create_cache_table()
