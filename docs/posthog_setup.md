# PostHog Configuration Guide

Follow these steps to set up your PostHog account and connect it to the **Market Ninja / Kage AI** frontend.

## 1. Create a Project
1.  Log in to [PostHog](https://us.posthog.com/signup).
2.  Click **"New Project"**.
3.  Name it `US Stock Market App` (or your preferred name).
4.  Select **"Web"** as the product type.
5.  When asked for the framework, you can select **"React"**, but we have already handled the code installation. You just need the keys.

## 2. Get Your API Keys
1.  Once the project is created, go to **Project Settings** (gear icon in the sidebar).
2.  Scroll down to the **"Project API Key"** section.
3.  Copy the **"Project API Key"** (It starts with `phc_`).
4.  Note your **"Instance/API Host"**.
    - If you are on US Cloud: `https://us.i.posthog.com`
    - If you are on EU Cloud: `https://eu.i.posthog.com`

## 3. Configure Local Environment
1.  Open your project's `.env` file (or create one in `frontend/`).
2.  Add the following lines:

```env
VITE_POSTHOG_KEY=your_copied_phc_key_here
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

## 4. Verify Installation
1.  Start your app locally (`npm run dev`).
2.  Go to your PostHog dashboard.
3.  Click on **"Activity"** or **"Events"** in the sidebar.
4.  Visit a few pages in your app (Landing, Market Overview).
5.  You should see events like `viewed_landing`, `viewed_market_overview`, and `$pageview` appearing in real-time.

## 5. Recommended Settings (Optional)
-   **Session Replay**: Go to **Session Replay** settings in PostHog and enable it to watch how users interact with the app.
-   **Feature Flags**: You can use Feature Flags later to control the "Coming Soon" features remotely.
