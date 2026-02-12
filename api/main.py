"""
Manin API — Market Ninja Backend
FastAPI server wrapping the existing quant analysis engine.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Add parent directory to path so we can import existing modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from routers import market, penny, payments, auth

app = FastAPI(
    title="Manin API",
    description="Market Ninja — AI-Powered Stock Intelligence",
    version="1.0.0",
)

# CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url, 
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://kage.sourcer.live",
        "https://manin-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(penny.router, prefix="/api/penny", tags=["Penny Stocks"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "manin-api", "version": "1.0.0"}
