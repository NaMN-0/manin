
import os
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from middleware.auth import get_current_user
import time

router = APIRouter()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

def _get_razorpay_client():
    try:
        import razorpay
        return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay not configured: {e}")

class PaymentVerify(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@router.post("/create-order")
async def create_order(user: dict = Depends(get_current_user)):
    """
    Creates a Razorpay Order for Lifetime Access (₹999).
    """
    client = _get_razorpay_client()
    user_id = user.get("id", user.get("sub", ""))
    
    try:
        # Create Order
        order_amount = 99900 # ₹999.00
        order_currency = "INR"
        # Shorten receipt ID to < 40 chars (Razorpay limit)
        # rcpt_ + 8 chars of uuid + _ + 10 chars of timestamp = ~24 chars
        short_uid = str(user_id)[:8]
        order_receipt = f"rcpt_{short_uid}_{int(time.time())}"
        
        order = client.order.create({
            "amount": order_amount,
            "currency": order_currency,
            "receipt": order_receipt,
            "notes": {
                "user_id": user_id,
                "email": user.get("email", ""),
                "plan": "lifetime_founder"
            }
        })
        
        return {
            "status": "ok",
            "data": {
                "orderId": order["id"],
                "amount": order_amount,
                "currency": order_currency,
                "keyId": RAZORPAY_KEY_ID
            }
        }
    except Exception as e:
        print(f"Order creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {e}")

@router.post("/verify")
async def verify_payment(payload: PaymentVerify, user: dict = Depends(get_current_user)):
    """
    Verifies the Razorpay payment signature.
    On success, grants Lifetime Pro access.
    """
    # Verify signature
    # Signature verification for Orders: hmac_sha256(order_id + "|" + payment_id, secret)
    message = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected_signature != payload.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Update user's status
    user_id = user.get("id", user.get("sub", ""))
    if SUPABASE_URL and SUPABASE_SERVICE_KEY and user_id:
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
                
                # 1. Update Auth Metadata
                await client.put(
                    f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                    headers=headers,
                    json={
                        "app_metadata": {
                            "subscription_status": "active",
                            "plan": "lifetime_founder",
                            "payment_id": payload.razorpay_payment_id
                        }
                    }
                )

                # 2. Insert Payment Record
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/manin_payments",
                    headers=headers,
                    json={
                        "user_id": user_id,
                        "razorpay_payment_id": payload.razorpay_payment_id,
                        "razorpay_order_id": payload.razorpay_order_id,
                        "razorpay_signature": payload.razorpay_signature,
                        "amount": 99900,
                        "status": "captured",
                        "verified_at": "now()"
                    }
                )

                # 3. Mark User as Pro (Lifetime)
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}",
                    headers=headers,
                    json={
                        "is_pro": True,
                        "plan": "lifetime_founder",
                        "valid_until": "2099-12-31T23:59:59Z", # Lifetime
                        "updated_at": "now()"
                    }
                )

        except Exception as e:
            print(f"[Warning] Failed to update Supabase: {e}")

    return {
        "status": "ok",
        "message": "Payment verified. Welcome to the Founders Club!",
        "data": {
            "paymentId": payload.razorpay_payment_id
        }
    }

@router.get("/status")
async def subscription_status(user: dict = Depends(get_current_user)):
    app_meta = user.get("app_metadata", {})
    is_pro = app_meta.get("subscription_status") == "active"
    plan = app_meta.get("plan", "free")
    
    return {
        "status": "ok",
        "data": {
            "isPro": is_pro,
            "plan": plan,
            "priceLabel": "Lifetime Founder" if plan == "lifetime_founder" else "Free"
        }
    }
