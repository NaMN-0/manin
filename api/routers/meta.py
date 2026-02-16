from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import httpx
from services.gamification_service import GamificationService # Import the service

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

class AddXpRequest(BaseModel):
    userId: str
    amount: int
    action: str

@router.get("/stats/{user_id}")
async def get_user_gamification_stats(user_id: str):
    """Fetch user's gamification stats (XP, level, rank)."""
    stats = await GamificationService.get_user_stats(user_id)
    if "error" in stats:
        raise HTTPException(status_code=500, detail=stats["error"])
    return stats

@router.post("/xp")
async def add_xp_to_user(request: AddXpRequest):
    """Add XP to a user and check for level up."""
    result = await GamificationService.add_xp(request.userId, request.amount, request.action)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

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

