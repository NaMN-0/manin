from fastapi import APIRouter, HTTPException
import os
import httpx

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

@router.get("/")
async def get_all_meta():
    """Fetch all meta keys and values."""
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
        }
        try:
            resp = await client.get(f"{SUPABASE_URL}/rest/v1/manin_meta?select=*", headers=headers)
            if resp.status_code != 200:
                print(f"Meta fetch error: {resp.text}")
                return {"status": "error", "data": []}
            return {"status": "ok", "data": resp.json()}
        except Exception as e:
            print(f"Meta exception: {e}")
            return {"status": "error", "message": str(e)}

@router.post("/increment/{key}")
async def increment_meta(key: str):
    """Atomically increment a meta integer value."""
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        try:
            # 1. Get current value
            resp = await client.get(f"{SUPABASE_URL}/rest/v1/manin_meta?key=eq.{key}&select=value_int", headers=headers)
            data = resp.json()
            
            if not data:
                # If key doesn't exist, create it with 1
                new_val = 1
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/manin_meta",
                    headers=headers,
                    json={"key": key, "value_int": new_val, "updated_at": "now()"}
                )
            else:
                curr = data[0].get("value_int", 0)
                new_val = curr + 1
                # 2. Update with incremented value
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/manin_meta?key=eq.{key}",
                    headers=headers,
                    json={"value_int": new_val, "updated_at": "now()"}
                )
            
            return {"status": "ok", "newValue": new_val}
        except Exception as e:
            print(f"Increment error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
