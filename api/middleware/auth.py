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
    Dependency: checks if the user has an active pro subscription.
    Checks app_metadata and user_metadata for subscription status.
    """
    user_meta = user.get("user_metadata", {})
    app_meta = user.get("app_metadata", {})
    email = user.get("email", "")

    is_pro = (
        app_meta.get("subscription_status") == "active"
        or user_meta.get("is_pro", False)
        or email == "naman1474@gmail.com"
    )

    if not is_pro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required. Upgrade to access full intelligence.",
        )
    return user
