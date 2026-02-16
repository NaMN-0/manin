# KAGE AI - Refactor & Restructuring Strategy

## 1. Product Restructuring: "The Quant Dojo"

We will realign the product around the **Dojo** metaphor to unify the Game and Tool aspects.

### Core Loop
1.  **Sparring (Trade):** User makes paper trades.
2.  **Training (Learn):** User reads "Sensei's" insights (AI analysis).
3.  **Ranking (Progress):** User earns XP to unlock deeper insights (Genin -> Kage).

### Navigation & Terminology Map

| Old Name | New Name | Concept |
| :--- | :--- | :--- |
| Market Overview | **Market Dojo** | The main floor. High-level stats. |
| Paper Trading | **Sparring** | Practice area. Risk-free. |
| Penny Stocks | **The Pit** | High risk, high reward area. |
| Pro Dashboard | **Inner Sanctum** | Advanced tools for paying members. |
| News | **Scrolls** | Intel and news. |
| AI Analysis | **Sensei's Insight** | The ML/Quant logic output. |

## 2. Technical Refactor Plan

### A. Folder Structure Cleanup

**Frontend (`frontend/src`)**
```
src/
├── api/                # Centralized API calls (no direct DB access in components)
│   ├── client.js       # Axios/Fetch wrapper
│   ├── auth.js
│   ├── game.js
│   └── market.js
├── assets/
├── components/
│   ├── common/         # Atomic UI (Buttons, Cards, Inputs)
│   ├── layout/         # Navbar, Footer, Sidebar
│   ├── features/       # Feature-specific widgets (TradeTicket, SenseiCard)
│   └── viz/            # Charts, Meters (Recharts wrappers)
├── context/            # Global state (cleaner, fewer providers)
├── hooks/              # Custom hooks (useMarketData, useGameStats)
├── pages/              # Route views
├── styles/             # Modular CSS
│   ├── main.css        # Imports others
│   ├── theme.css       # Variables (Ninja palette)
│   ├── utilities.css   # Custom utility classes
│   └── components.css  # extracted from index.css
└── utils/
```

**Backend (`api/`)**
```
api/
├── main.py
├── core/               # Config, DB, Logging
├── routers/            # Endpoint definitions (thin layer)
├── services/           # Business logic
│   ├── quant_bridge.py # NEW: Bridge to analysis_alpha_suite
│   └── ...
└── schemas/            # Pydantic models (request/response)
```

### B. "Sensei" AI Integration (Smartness Redesign)

The current "Sentiment Score" is too abstract. We will introduce **Sensei**, a visual AI assistant.

**Visual Metaphors:**
1.  **The Aura:**
    *   **Red Aura:** High Volatility / Bearish Pressure.
    *   **Blue Aura:** Calm / Accumulation.
    *   **Gold Aura:** High Conviction Bullish Setup.
2.  **Confidence Meter:**
    *   Instead of raw probability, show a "Chakra Meter" (Confidence).
3.  **Verdict Card:**
    *   "Sensei says: **Wait.** Volume is fading." (Human-readable generation).

**Backend Implementation:**
*   Create `services/quant_bridge.py`.
*   This service will:
    1.  Import `quant_engine` (lazily if needed).
    2.  Run `infer(ticker)` on demand or fetch from a pre-computed Redis/Supabase cache.
    3.  Format the `LGBM` probabilities into a "Sensei Verdict".

### C. Gamification Logic Migration

*   **Frontend:** Remove `calculateLevel` logic.
*   **Backend:** Ensure `add_xp` returns the *new* level and progress %.
*   **Sync:** Frontend simply displays what the backend returns.

## 3. Execution Roadmap

1.  **Styles Refactor:** Split `index.css` -> Modular files. (Low Risk)
2.  **API Layer:** Create `frontend/src/api/` and migrate direct Supabase calls. (Medium Risk)
3.  **Quant Bridge:** Implement `api/services/quant_bridge.py` and an endpoint `/api/sensei/{ticker}`. (High Value)
4.  **UI Overhaul:** Update `MarketOverview` to use the new "Dojo" layout and "Sensei" widgets. (High Visibility)
5.  **Gamification Cleanup:** Centralize logic. (Maintenance)

## 4. Safety & Constraints

*   **No "Cool" Bloat:** Only add animations if they serve data (e.g., loading states, alerts).
*   **Free Tier:** Ensure "Sensei" features have a "teaser" mode for free users (e.g., "Sensei sees a pattern here... Upgrade to unlock").
*   **Performance:** Cache Quant Engine results. Do not run ML inference on every page load.
