
import os
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
import httpx

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

@router.post("/on-login")
async def on_user_login(user: dict = Depends(get_current_user)):
    """
    Called when user logs in.
    1. Checks if user exists in `manin_users`. If not, adds them.
    2. Returns total count and 'founders' count.
    """
    user_id = user.get("id", user.get("sub", ""))
    email = user.get("email", "")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"status": "error", "message": "Supabase not configured"}

    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        try:
            # 1. Check/Insert User (Lazy Creation)
            # We catch specific metadata from the user JWT to populate the profile
            user_meta = user.get("user_metadata", {})
            full_name = user_meta.get("full_name") or user_meta.get("name")
            avatar_url = user_meta.get("avatar_url") or user_meta.get("picture")

            res = await client.get(f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}&select=*", headers=headers)
            existing_user = res.json()
            
            if not existing_user:
                # Create the user profile since trigger is disabled
                print(f"Creating missing profile for {email}")
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/manin_users",
                    headers=headers,
                    json={
                        "id": user_id,
                        "email": email,
                        "full_name": full_name,
                        "avatar_url": avatar_url,
                        "created_at": "now()",
                        "updated_at": "now()",
                        "is_pro": False,
                        "plan": "free",
                        "combat_style": "ronin"
                    }
                )
            else:
                # Optional: Update existing profile if fields are missing? 
                # For now, let's keep it simple. Only insert if missing.
                pass
            
            # 2. Get User Count (Total)
            count_res = await client.get(f"{SUPABASE_URL}/rest/v1/manin_users?select=count", headers={**headers, "Range": "0-0"})
            content_range = count_res.headers.get("Content-Range", "0-0/0")
            total_str = content_range.split('/')[-1]
            total_count = int(total_str) if total_str.isdigit() else 0
            
            # 3. Get Founders Count (Paid Users)
            founders_res = await client.get(f"{SUPABASE_URL}/rest/v1/manin_users?select=count&plan=eq.lifetime_founder", headers={**headers, "Range": "0-0"})
            founders_range = founders_res.headers.get("Content-Range", "0-0/0")
            founders_str = founders_range.split('/')[-1]
            founders_count = int(founders_str) if founders_str.isdigit() else 0
            
            return {
                "status": "ok",
                "data": {
                    "userCount": total_count,
                    "foundersCount": founders_count,
                    "foundersLimit": 1000,
                    "promoApplied": False 
                }
            }
            
        except Exception as e:
            print(f"Auth hook error: {e}")
            # Don't block login on error
            return {"status": "ok", "data": {"userCount": 0, "foundersCount": 0}}


@router.get("/profile")
async def get_user_profile(user: dict = Depends(get_current_user)):
    """Get user's extended profile (combat_style, user_profile JSONB)."""
    user_id = user.get("id", user.get("sub", ""))

    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
        }
        try:
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}&select=combat_style,user_profile",
                headers=headers
            )
            data = res.json()
            if data and len(data) > 0:
                return {"status": "ok", "data": data[0]}
            return {"status": "ok", "data": {"combat_style": "ronin", "user_profile": {}}}
        except Exception as e:
            print(f"Profile fetch error: {e}")
            return {"status": "error", "message": str(e)}


@router.patch("/profile")
async def update_user_profile(body: dict, user: dict = Depends(get_current_user)):
    """
    Update user's combat_style and/or user_profile.
    Body: { "combat_style": "genin"|"jonin"|"kage", "user_profile": {...} }
    """
    user_id = user.get("id", user.get("sub", ""))
    
    update_data = {}
    if "combat_style" in body:
        if body["combat_style"] not in ("genin", "jonin", "kage", "ronin"):
            raise HTTPException(status_code=400, detail="Invalid combat_style")
        update_data["combat_style"] = body["combat_style"]
    if "user_profile" in body:
        update_data["user_profile"] = body["user_profile"]
    
    if not update_data:
        return {"status": "ok", "message": "Nothing to update"}

    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        try:
            res = await client.patch(
                f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}",
                headers=headers,
                json=update_data
            )
            if res.status_code >= 300:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return {"status": "ok", "message": "Profile updated"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Profile update error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

