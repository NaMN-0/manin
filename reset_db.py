import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env
load_dotenv(dotenv_path='api/.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in api/.env")
    exit(1)

supabase: Client = create_client(url, key)

async def factory_reset():
    print("⚠️  WARNING: THIS WILL DELETE ALL USER DATA (Users, Payments, Logs).")
    confirm = input("Are you sure? Type 'DELETE' to confirm: ")
    
    if confirm != "DELETE":
        print("❌ Aborted.")
        return

    print("🔥 Initiating Factory Reset...")

    try:
        # 1. Truncate Tables (Cascade should handle relations, but being explicit is safer)
        # Note: We can't easily delete from auth.users via client library usually, 
        # but if we have service_role key we might be able to using rpc if set up, 
        # or just clear the public tables.
        # Clearing public tables:
        
        tables = ['manin_scan_logs', 'manin_subscriptions', 'manin_payments', 'manin_users']
        
        for table in tables:
            print(f"   Cleaning {table}...")
            # Delete all rows
            res = supabase.table(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        print("✅ Tables Cleared.")
        
        # 2. Reset specific Pro flags if we were keeping users (optional, but we deleted them above)
        # If we wanted to keep users but reset status:
        # supabase.table('manin_users').update({'is_pro': False, 'combat_style': 'ronin', 'user_profile': {}}).neq('id', 'x').execute()

        print("✨ Factory Reset Complete. The system is clean.")

    except Exception as e:
        print(f"❌ Error during reset: {e}")

if __name__ == "__main__":
    asyncio.run(factory_reset())
