from fastapi import APIRouter
from services.quant_bridge import QuantBridgeService

router = APIRouter()

@router.get("/tactical-analysis/{ticker}")
async def get_tactical_analysis(ticker: str):
    """
    Retrieves Sensei's tactical analysis for a given ticker,
    including a verdict, reasoning, and key signals.
    """
    analysis = await QuantBridgeService.get_sensei_analysis(ticker)
    return {"status": "ok", "data": analysis}
