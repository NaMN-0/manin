import sys
import os
import asyncio
from typing import Dict, Any, Optional

# Add parent directory of analysis_alpha_suite to path
# This allows importing quant_engine and other modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../analysis_alpha_suite')))

try:
    from quant_engine import infer, run_pybroker_full_backtest, run_quick_test
except ImportError:
    infer = None
    run_pybroker_full_backtest = None
    run_quick_test = None
    print("WARNING: quant_engine (pybroker) not found. Sensei analysis will be limited.")
# from analysis_alpha_suite.pybroker_trainer.strategy_loader import STRATEGY_CLASS_MAP

class QuantBridgeService:
    @staticmethod
    async def get_sensei_analysis(ticker: str, strategy_type: str = 'trend_following') -> Dict[str, Any]:
        """
        Retrieves Sensei's tactical analysis for a given ticker.
        This function leverages the quant_engine's inference capabilities.
        """
        try:
            if infer is None:
                # Fallback to standard market analysis if Alpha Suite is disabled
                try:
                    from services.market_service import analyze_ticker
                    
                    # Run standard analysis in thread
                    analysis = await asyncio.to_thread(analyze_ticker, ticker.upper())
                    
                    if analysis:
                        # Map standard analysis to Sensei format
                        is_bullish = "BUY" in analysis["verdict"]
                        return {
                            "ticker": analysis["ticker"],
                            "price": analysis["price"],
                            "changePct": analysis["changePct"],
                            "companyName": f"{analysis['ticker']}", # Placeholder
                            "sector": "Unknown Sector", 
                            "pe": 0, "volume": 0, "marketCap": 0, "yearHigh": 0, "yearLow": 0,
                            "rsi": analysis.get("rsi", 0),
                            "macd": 0,
                            "verdict": analysis["verdict"],
                            "reasoning": f"Sensei Alpha Suite unavailable. Tactical Briefing based on standard indicators: {', '.join(analysis['signals'])}. Market shows {analysis['verdict'].lower()} signals.",
                            "signals": analysis["signals"],
                            "predicted": round(analysis["price"] * (1.15 if is_bullish else 0.90), 2),
                            "score": analysis["score"] * 2, # Scale 0-4 to 0-8 approx
                            "priceHistory": analysis["priceHistory"]
                        }
                except Exception as e:
                    print(f"Fallback analysis failed for {ticker}: {e}")

                return {
                    "ticker": ticker.upper(),
                    "verdict": "DATA UNAVAILABLE",
                    "reasoning": "Sensei analysis is currently disabled (alpha suite not loaded).",
                    "signals": [], "error": True, "score": 0,
                    "price": 0, "changePct": 0, "companyName": "", "sector": "",
                    "pe": 0, "volume": 0, "marketCap": 0, "yearHigh": 0, "yearLow": 0,
                    "rsi": 0, "macd": 0, "predicted": 0, "priceHistory": []
                }

            analysis_result = await asyncio.to_thread(
                infer, 
                ticker=ticker.upper(), 
                strategy_type=strategy_type
            )

            if analysis_result and not analysis_result.get("error"):
                decision = analysis_result["decision"]
                probabilities = analysis_result["probabilities"]
                
                # Determine verdict and reasoning based on decision and probabilities
                verdict = ""
                reasoning = ""
                
                if decision == "BUY":
                    verdict = "STRONG BUY" if probabilities[1] > 0.7 else "BUY"
                    reasoning = "Sensei's algorithms detect a high-probability bullish setup with favorable risk-adjusted returns and consistent win rate. Consider adding to your watch list."
                elif decision == "SELL":
                    verdict = "STRONG SELL" if probabilities[0] > 0.7 else "SELL"
                    reasoning = "Bearish patterns emerging. Sensei advises defensive positioning or short opportunity. High risk of downside."
                else: # HOLD
                    verdict = "HOLD"
                    reasoning = "Market is consolidating. Sensei advises patience and observation. Awaiting clearer signals before committing."
                
                # Score based on confidence (e.g., probability of the predicted outcome)
                score = round(max(probabilities) * 10) # Max probability converted to 1-10 score

                # Extract other data points from analysis_result
                price_history = analysis_result.get("priceHistory", [])
                current_price = analysis_result.get("price", 0.0)
                change_pct = analysis_result.get("changePct", 0.0)
                company_name = analysis_result.get("companyName", f"{ticker} Corp")
                sector = analysis_result.get("sector", "Unknown Sector")
                pe_ratio = analysis_result.get("pe", 0.0)
                volume = analysis_result.get("volume", 0)
                market_cap = analysis_result.get("marketCap", 0)
                year_high = analysis_result.get("yearHigh", 0)
                year_low = analysis_result.get("yearLow", 0)
                rsi = analysis_result.get("rsi", 0)
                macd = analysis_result.get("macd", 0)
                predicted_price = analysis_result.get("predicted", current_price)
                signals = analysis_result.get("signals", [])

                return {
                    "ticker": ticker.upper(),
                    "price": current_price,
                    "changePct": change_pct,
                    "companyName": company_name,
                    "sector": sector,
                    "pe": pe_ratio,
                    "volume": volume,
                    "marketCap": market_cap,
                    "yearHigh": year_high,
                    "yearLow": year_low,
                    "rsi": rsi,
                    "macd": macd,
                    "verdict": verdict,
                    "reasoning": reasoning,
                    "signals": signals,
                    "predicted": predicted_price, 
                    "score": score,
                    "priceHistory": price_history
                }
            else:
                # Fallback if infer() does not return a valid result
                return {
                    "ticker": ticker.upper(),
                    "verdict": "DATA UNAVAILABLE",
                    "reasoning": "Sensei cannot establish a clear tactical briefing for this target at this time. Insufficient data, model not trained, or artifact missing. Please ensure the 'train' command has been run for this ticker and strategy.",
                    "signals": [],
                    "error": True,
                    "score": 0,
                    "price": 0, "changePct": 0, "companyName": "", "sector": "",
                    "pe": 0, "volume": 0, "marketCap": 0, "yearHigh": 0, "yearLow": 0,
                    "rsi": 0, "macd": 0, "predicted": 0, "priceHistory": []
                }

        except Exception as e:
            print(f"Error in QuantBridgeService.get_sensei_analysis for {ticker}: {e}")
            return {
                "ticker": ticker.upper(),
                "verdict": "ERROR",
                "reasoning": f"Sensei's systems are experiencing a malfunction: {str(e)}. Please retry later.",
                "signals": [],
                "error": True
            }