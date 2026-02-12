
import os
import json
from datetime import datetime, timedelta
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

supabase: Client = None

if url and key:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Supabase init failed: {e}")
else:
    print("Warning: SUPABASE_URL or KEYS missing. Caching disabled.")

class CacheService:
    @staticmethod
    def get(key: str, max_age_minutes: int = 15):
        """
        Retrieve a value from the cache if it's not expired.
        """
        if not supabase: return None
        try:
            # Fetch from Supabase
            response = supabase.table("cache").select("*").eq("key", key).execute()
            
            if not response.data:
                return None
            
            entry = response.data[0]
            updated_at_str = entry.get("updated_at")
            
            # Check expiry
            if updated_at_str:
                # Handle ISO format with potential Z or +00:00
                updated_at = datetime.fromisoformat(updated_at_str.replace('Z', '+00:00'))
                
                # Check if expired
                if datetime.now(updated_at.tzinfo) - updated_at > timedelta(minutes=max_age_minutes):
                    # It's expired, but we might still return it if we want "stale-while-revalidate" logic elsewhere.
                    # For now, let's treat it as a cache miss for the caller, 
                    # OR we return it with a flag. Let's return None to force refresh.
                    return None

            return entry.get("value")
            
        except Exception as e:
            print(f"[CacheService] Error fetching {key}: {e}")
            return None

    @staticmethod
    def set(key: str, value: dict):
        """
        Save a value to the cache.
        """
        if not supabase: return
        try:
            data = {
                "key": key,
                "value": value,
                "updated_at": datetime.now().isoformat()
            }
            # Upsert
            supabase.table("cache").upsert(data).execute()
        except Exception as e:
            print(f"[CacheService] Error setting {key}: {e}")

    @staticmethod
    def get_stale(key: str):
        """
        Retrieve a value regardless of age (good for fallbacks).
        """
        if not supabase: return None
        try:
            response = supabase.table("cache").select("*").eq("key", key).execute()
            if response.data:
                return response.data[0].get("value")
        except Exception:
            pass
        return None
