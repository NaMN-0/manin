# Deployment Guide for Render

This project is configured for easy deployment on [Render](https://render.com) using Infrastructure as Code (IaC) via the `render.yaml` file.

## Prerequisites

1.  **GitHub Repository**: Ensure this code is pushed to a GitHub repository.
2.  **Render Account**: Create an account on [Render](https://render.com).
3.  **Supabase Project**: You should have your Supabase URL and keys ready.

## Deployment Steps

### 1. Connect to Render

1.  Go to the [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository containing this code.

### 2. Configure Blueprint

Render will automatically detect the `render.yaml` file and propose two services:

1.  **manin-api**: The Python/FastAPI backend (Docker).
2.  **manin-frontend**: The React frontend (Static Site).

> **Free Tier Notice**: The `manin-api` service is configured to use the **Free** instance type. This means:
> *   It will spin down after 15 minutes of inactivity.
> *   The first request after inactivity will take 30-50 seconds to respond.
> *   Usage is limited to 750 hours/month (enough for one service running 24/7, but be mindful if you have other projects).

### 3. Environment Variables

You will be prompted to provide values for the following environment variables. These are critical for the application to function.

#### Backend (`manin-api`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key | `eyJh...` |
| `SUPABASE_JWT_SECRET` | Your Supabase JWT Secret | `super-secret-jwt` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `...` |
| `RAZORPAY_PLAN_ID` | Razorpay Plan ID | `plan_...` |
| `FRONTEND_URL` | URL of your deployed frontend | `https://your-frontend-name.onrender.com` |

> **Note on FRONTEND_URL**: You won't know the exact frontend URL until it's created. You can leave this as a placeholder initially, and update it later in the Render Dashboard -> `manin-api` -> Environment.

#### Frontend (`manin-frontend`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Check your Supabase project | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Check your Supabase project | `eyJh...` |
| `VITE_RAZORPAY_KEY_ID` | Check your Razorpay account | `rzp_test_...` |
| `VITE_API_URL` | **CRITICAL**: Use `/api` | `/api` |

> **Important**: Set `VITE_API_URL` to `/api` (exactly like that). The `render.yaml` file includes a rewrite rule that proxies requests from `/api/*` to the backend service. This avoids CORS issues and complex URL configurations.

### 4. Finalize Deployment

1.  Click **Apply**.
2.  Render will start building both services.
3.  The frontend build (`npm run build`) will generate static files.
4.  The backend build will create a Docker container.

### 5. Post-Deployment Verification

1.  Once deployed, visit your frontend URL (e.g., `https://manin-frontend.onrender.com`).
2.  Check the browser console for any errors.
3.  Verify that API calls (like fetching market data) are working.
4.  Update `FRONTEND_URL` in the **backend service** environment variables to the actual frontend URL if you hadn't already.

## Troubleshooting

-   **Build Failures**: Check the logs in the Render dashboard.
-   **CORS Errors**: Ensure `FRONTEND_URL` in the backend environment matches your actual frontend URL.
-   **API Errors**: Verify `VITE_API_URL` is set to `/api` in the frontend environment.
