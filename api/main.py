"""
Manin API — Market Ninja Backend
FastAPI server wrapping the existing quant analysis engine.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from services.market_service import get_market_overview

# Add parent directory to path so we can import existing modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from routers import market, penny, payments, auth, meta, news

app = FastAPI(
    title="Manin API",
    description="Market Ninja — AI-Powered Stock Intelligence",
    version="1.0.0",
)

# Setup Scheduler (Background cache refresh)
scheduler = BackgroundScheduler()

def update_market_cache():
    print(f"[{datetime.now()}] Running background job: update_market_cache")
    try:
        # This function internally writes to Supabase cache
        get_market_overview()
        print("Market cache updated.")
    except Exception as e:
        print(f"Background job failed: {e}")

@app.on_event("startup")
def start_scheduler():
    # Run after 60s to allow health checks to pass first
    scheduler.add_job(update_market_cache, 'date', run_date=datetime.now() + timedelta(seconds=60))
    # Then every 15 mins
    scheduler.add_job(update_market_cache, 'interval', minutes=15)
    scheduler.start()
    print("Background scheduler started.")

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

# CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url, 
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://kage.sourcer.live",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(penny.router, prefix="/api/penny", tags=["Penny Stocks"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(meta.router, prefix="/api/meta", tags=["Meta"])
app.include_router(news.router, prefix="/api/news", tags=["News Intelligence"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "manin-api", "version": "1.0.0"}
