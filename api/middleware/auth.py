"""
Supabase JWT authentication middleware.
Verifies the Bearer token using Supabase's GoTrue API.
No JWT_SECRET needed — validates directly against Supabase.
"""

import os
import httpx
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


async def _verify_token_with_supabase(token: str) -> dict:
    """Verify JWT by calling Supabase's GoTrue /auth/v1/user endpoint."""
    if not SUPABASE_URL:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL not configured",
        )

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
            },
            timeout=10.0,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return resp.json()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Dependency: extracts and validates the current user from JWT."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return await _verify_token_with_supabase(credentials.credentials)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Dependency: returns user if authenticated, None otherwise."""
    if credentials is None:
        return None
    try:
        return await _verify_token_with_supabase(credentials.credentials)
    except HTTPException:
        return None


async def require_pro(user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency: checks if the user has an active pro subscription OR a free trial available.
    """
    user_meta = user.get("user_metadata", {})
    app_meta = user.get("app_metadata", {})
    email = user.get("email", "")

    # 1. Check permanent Pro status
    is_pro = (
        app_meta.get("subscription_status") == "active"
        or user_meta.get("is_pro", False)
        or email == "naman1474@gmail.com"
    )

    if is_pro:
        return user

    # 2. Check Free Trial status
    # Check trial flag in app_metadata (if synced) or user_metadata
    has_used_trial = app_meta.get("has_used_trial", False) or user_meta.get("has_used_trial", False)
    
    if has_used_trial:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free trial expired. Upgrade to Pro for lifetime access.",
        )

    # 3. Double check DB for trial if not explicitly marked as used in token
    # This prevents "double trial" if JWT is old.
    user_id = user.get("id")
    if user_id:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{os.getenv('SUPABASE_URL')}/rest/v1/manin_users?id=eq.{user_id}&select=has_used_trial",
                    headers={
                        "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
                        "apikey": os.getenv("SUPABASE_SERVICE_KEY", ""),
                    },
                    timeout=5.0
                )
                if resp.status_code == 200 and resp.json():
                    if resp.json()[0].get("has_used_trial", False):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Free trial expired. Upgrade to Pro for lifetime access.",
                        )
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Warning] Trial check DB error: {e}")

    # User is in "Trial Phase" (hasn't consumed it yet)
    return user


async def consume_pro_trial(user: dict):
    """
    Utility: Marks the user's free trial as consumed in the database.
    Does nothing if the user is already Pro.
    """
    app_meta = user.get("app_metadata", {})
    email = user.get("email", "")
    
    # 1. If already Pro (paid), no need to consume trial
    if app_meta.get("subscription_status") == "active" or email == "naman1474@gmail.com":
        return

    # 2. Update has_used_trial in manin_users table
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    
    user_id = user.get("id")
    if not user_id:
        return

    async with httpx.AsyncClient() as client:
        # Update our tracking table
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "apikey": SUPABASE_SERVICE_KEY,
                "Content-Type": "application/json"
            },
            json={"has_used_trial": True}
        )
