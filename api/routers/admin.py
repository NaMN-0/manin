
import os
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
import httpx

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

def require_admin(user: dict = Depends(get_current_user)):
    email = user.get("email", "")
    if email != "naman1474@gmail.com":
        raise HTTPException(status_code=403, detail="Admin access denied")
    return user

@router.get("/logs")
async def get_logs(lines: int = 100, _user: dict = Depends(require_admin)):
    """
    Returns the last N lines of the application log.
    """
    log_path = "logs/app.log"
    if not os.path.exists(log_path):
        return {"status": "error", "message": "Log file not found"}
    
    try:
        with open(log_path, "r") as f:
            # Efficiently read last N lines
            all_lines = f.readlines()
            last_lines = all_lines[-lines:]
            return {"status": "ok", "data": "".join(last_lines)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/stats")
async def get_admin_stats(_user: dict = Depends(require_admin)):
    """
    Returns high-level user stats from Supabase.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"status": "error", "message": "Supabase not configured"}

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
    }

    async with httpx.AsyncClient() as client:
        try:
            # 1. Total Users
            res_total = await client.get(f"{SUPABASE_URL}/rest/v1/manin_users?select=count", headers={**headers, "Range": "0-0"})
            total_count = int(res_total.headers.get("Content-Range", "0-0/0").split('/')[-1])

            # 2. Pro Users
            res_pro = await client.get(f"{SUPABASE_URL}/rest/v1/manin_users?select=count&is_pro=eq.true", headers={**headers, "Range": "0-0"})
            pro_count = int(res_pro.headers.get("Content-Range", "0-0/0").split('/')[-1])

            # 3. Recent Users (Last 24h)
            # This requires a 'created_at' check, Supabase syntax: created_at=gte.ISO_TIMESTAMP
            from datetime import datetime, timedelta
            yesterday = (datetime.now() - timedelta(days=1)).isoformat()
            res_recent = await client.get(f"{SUPABASE_URL}/rest/v1/manin_users?select=count&created_at=gte.{yesterday}", headers={**headers, "Range": "0-0"})
            recent_count = int(res_recent.headers.get("Content-Range", "0-0/0").split('/')[-1])

            return {
                "status": "ok",
                "data": {
                    "totalUsers": total_count,
                    "proUsers": pro_count,
                    "recentUsers24h": recent_count,
                    "serverTime": datetime.now().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
