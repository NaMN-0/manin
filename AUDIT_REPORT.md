# KAGE AI - Full Codebase Audit & Architecture Report

## 1. Architecture Overview

### Frontend
- **Framework:** React 19 (Vite)
- **State Management:** Context API (`AuthContext`, `GameContext`) + Local State
- **Styling:** CSS Variables (Ninja Theme) + Utility Classes + Glassmorphism in a monolithic `index.css`
- **Routing:** `react-router-dom` v7
- **Analytics:** PostHog
- **Key Issues:**
    - **Monolithic CSS:** `index.css` is 600+ lines, mixing global resets, component styles, and utilities. Hard to maintain.
    - **Leaky Abstractions:** `GameContext` contains business logic (level calculation) duplicated from the backend.
    - **Direct DB Access:** Frontend connects directly to Supabase for some game stats, bypassing the API layer in places.
    - **Scattered Navigation:** Routing logic is split between `App.jsx` and layout components.

### Backend
- **Framework:** FastAPI
- **Database:** Supabase (PostgreSQL)
- **ORM/Data Access:** `sqlalchemy` (via `analysis_alpha_suite`), raw SQL/`httpx` (via `gamification_service`), `supa-client` (implied).
- **Quant Engine:** `analysis_alpha_suite` (Python/Pandas/PyBroker/LightGBM). Powerful but largely CLI-driven and disconnected from the real-time API.
- **AI/News:** `NewsService` uses basic keyword matching on `yfinance` headlines. "Fake AI" perception risk.
- **Key Issues:**
    - **Service/Router Mix:** Business logic leaks into routers.
    - **Synchronous Bottlenecks:** `yfinance` calls in `NewsService` are synchronous and could block the event loop if not careful.
    - **Quant Isolation:** The sophisticated backtesting engine isn't fully leveraged in the user-facing API.

## 2. Feature Inventory

| Feature Category | Feature Name | Status | Purpose | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Core Trading** | Paper Trading | Active | Allow users to practice without risk. | **Keep & Enhance.** Centralize logic. |
| **Core Trading** | Market Overview | Active | Dashboard for top movers/trends. | **Keep.** Improve caching. |
| **Core Trading** | Penny Stocks | Active | Filtered list of high-volatility stocks. | **Keep.** Niche appeal. |
| **Quant/AI** | Alpha Suite | Hidden/CLI | Backtesting & ML Strategy Tuning. | **Expose.** Make this the "Sensei" feature. |
| **Quant/AI** | News Sentiment | Active | Keyword-based sentiment scoring. | **Refactor.** Replace with "Sensei" narrative. |
| **Gamification** | XP & Leveling | Active | User retention loop. | **Keep.** Move logic strictly to backend. |
| **Gamification** | Ranks (Genin/Kage) | Active | Status symbols. | **Keep.** Tie to feature unlocks. |
| **Monetization** | Pro Gate | Active | Upsell blocking for premium features. | **Keep.** Make the value prop clearer. |

## 3. UX & Cognitive Flow Analysis

### Confusion Map
- **"Pro" vs "Game":** Users might be confused if they are playing a game or using a serious tool. The "Ninja" theme straddles this line dangerously.
- **Navigation:** "Market", "Penny", "Paper Trading" are peer items, but "Pro" is a gate. The hierarchy is flat and slightly cluttered.
- **Onboarding:** Currently relies on a `Welcome` page. Needs a more interactive "First Trade" tutorial.

### Drop-off Risks
- **News Page:** "Sentiment Score: 5" is abstract. Users don't know if that's good or bad without context.
- **Profile:** Basic stats page. Doesn't encourage "next step".
- **Empty States:** If `yfinance` fails (common), the dashboard looks broken.

## 4. Product Positioning Diagnosis

**Current State:** Schizophrenic.
- It tries to be a **Serious Quant Tool** (Alpha Suite).
- It tries to be a **Casual Game** (Ninja Ranks).
- It tries to be a **News Aggregator**.

**Proposed Core Positioning:**
**"The Gamified Quant Dojo"**
- *You are not just a trader; you are a student (Genin) becoming a master (Kage).*
- *The AI is your Sensei.* It doesn't just give data; it gives **Lessons** and **Insights**.
- *Paper Trading is your Sparring Session.*
- *Pro Mode is the "Secret Scroll" (Advanced Strategies).*

## 5. Refactor Plan (High Level)

### Phase 1: Structural Cleanup
1.  **CSS Modularization:** Break `index.css` into `styles/theme.css`, `styles/components/`, `styles/utilities.css`.
2.  **Frontend API Layer:** Create `src/api/` to abstract all fetch/Supabase calls. Remove direct DB access from components.
3.  **Backend Unification:** Ensure all frontend requests go through FastAPI.

### Phase 2: The "Sensei" Integration
1.  **Expose Quant Engine:** Create an API endpoint that runs (or retrieves cached) `quant_engine` inference for a stock.
2.  **Visual Overhaul:** Replace raw numbers with "Sensei's Verdict" (e.g., "Bullish Setup Detected - 85% Confidence").

### Phase 3: Gamification 2.0
1.  **Server-Side Logic:** Move all XP/Level calculations to `gamification_service.py`.
2.  **Unlockable Insights:** Low-level users see basic data. High-level users see ML predictions. This drives the "Play to Earn Knowledge" loop.

