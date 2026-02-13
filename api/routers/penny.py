"""
Penny stock router — basic (login required) and pro (subscription required) endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_user, require_pro, consume_pro_trial
from services.penny_service import (
    get_basic_penny_list,
    run_full_scan,
    analyze_single_penny,
)

router = APIRouter()


@router.get("/basic")
async def basic_penny_list(
    limit: int = Query(50, ge=10, le=200),
    user: dict = Depends(get_current_user),
):
    """
    Basic penny stock list — price, volume, highs/lows.
    Requires login.
    """
    try:
        data = get_basic_penny_list(limit=limit)
        return {"status": "ok", "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan")
async def full_scan(
    limit: int = Query(100, ge=20, le=500),
    user: dict = Depends(require_pro),
):
    """
    Full AI scan with predictions, signals, and scoring.
    Requires Pro subscription.
    """
    try:
        await consume_pro_trial(user)
        data = run_full_scan(limit=limit)
        return {"status": "ok", "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan_batch")
async def scan_batch(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user: dict = Depends(require_pro),
):
    """
    Progressive scan — returns a small batch of analyzed tickers.
    Requires Pro subscription.
    """
    try:
        await consume_pro_trial(user)
        from services.penny_service import run_batch_scan
        data = run_batch_scan(limit=limit, offset=offset)
        return {"status": "ok", "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze/{ticker}")
async def analyze_penny(
    ticker: str,
    user: dict = Depends(get_current_user),
):
    """
    Deep analysis on a single penny stock.
    Requires login.
    """
    result = analyze_single_penny(ticker.upper())
    if result is None:
        raise HTTPException(status_code=404, detail=f"No data for {ticker}")
    return {"status": "ok", "data": result}
