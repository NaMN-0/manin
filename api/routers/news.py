from fastapi import APIRouter, Depends, HTTPException
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
