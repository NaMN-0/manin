"""
Market analysis router — free endpoints for market overview and ticker analysis.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from middleware.auth import get_optional_user
from services.market_service import get_market_overview, analyze_ticker

router = APIRouter()


@router.get("/overview")
def market_overview():
    """
    Returns major index data, top movers, and market status.
    Free — no auth required.
    """
    try:
        data = get_market_overview()
        return {"status": "ok", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze/{ticker}")
def analyze(ticker: str):
    """
    Deep technical analysis on a single ticker.
    Free — no auth required.
    """
    result = analyze_ticker(ticker.upper())
    if result is None:
        raise HTTPException(status_code=404, detail=f"No data for ticker {ticker}")
    return {"status": "ok", "data": result}
    
@router.get("/smart-scan")
def smart_scan(letter: Optional[str] = None, sector: Optional[str] = None, universe: str = "penny", strategy: str = "momentum"):
    """
    Smart Discovery Mode: Scans a batch of tickers by 'letter' or 'sector'.
    Returns 'Coiled Spring' candidates.
    """
    from services.market_service import get_smart_batch
    try:
        data = get_smart_batch(letter=letter, sector=sector, universe_type=universe, strategy=strategy)
        return {"status": "ok", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
