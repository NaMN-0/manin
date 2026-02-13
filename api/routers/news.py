from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from middleware.auth import require_pro, consume_pro_trial
from services.news_service import NewsService

router = APIRouter()

@router.get("/intelligence")
async def get_intelligence(user: dict = Depends(require_pro)):
    """
    Get top 10 stocks with news sentiment and 3-4 day outlook.
    Consumes trial for non-pro users on first run.
    """
    try:
        # Trigger trial consumption
        await consume_pro_trial(user)
        
        data = NewsService.get_ai_intelligence()
        return {"status": "ok", "data": data}
    except Exception as e:
        print(f"News Router Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class BatchAnalysisRequest(BaseModel):
    tickers: list[str]

@router.post("/batch")
async def batch_analysis(payload: BatchAnalysisRequest, user: dict = Depends(require_pro)):
    """
    Analyze specific tickers for news sentiment.
    Consumes trial for non-pro users.
    """
    try:
        # Validate input
        if len(payload.tickers) > 20:
             raise HTTPException(status_code=400, detail="Batch size limited to 20 tickers.")
        
        # Trigger trial consumption
        await consume_pro_trial(user)
        
        data = NewsService.analyze_tickers(payload.tickers)
        return {"status": "ok", "data": data}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Batch Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
