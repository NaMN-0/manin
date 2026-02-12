-- ============================================================
-- Manin — User & Payment Tracking Tables
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. User profiles (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS manin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_pro BOOLEAN DEFAULT FALSE,
    pro_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION manin_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO manin_users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION manin_handle_new_user();

-- 2. Payment / subscription records
CREATE TABLE IF NOT EXISTS manin_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES manin_users(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT,
    razorpay_subscription_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL DEFAULT 99900,       -- paise (₹999)
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created',       -- created | captured | failed | refunded
    plan TEXT NOT NULL DEFAULT 'pro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_manin_payments_user ON manin_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manin_payments_sub ON manin_payments(razorpay_subscription_id);

-- 3. Subscription history log
CREATE TABLE IF NOT EXISTS manin_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES manin_users(id) ON DELETE CASCADE,
    razorpay_subscription_id TEXT NOT NULL,
    razorpay_plan_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',        -- active | paused | cancelled | expired
    current_start TIMESTAMPTZ,
    current_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manin_subs_user ON manin_subscriptions(user_id);

-- 4. Usage / analytics (lightweight)
CREATE TABLE IF NOT EXISTS manin_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES manin_users(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL,                      -- 'market_overview' | 'ticker_analysis' | 'penny_basic' | 'penny_full_scan'
    ticker TEXT,
    result_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manin_scans_user ON manin_scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_manin_scans_date ON manin_scan_logs(created_at);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE manin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE manin_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE manin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manin_scan_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile"
    ON manin_users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
    ON manin_users FOR UPDATE
    USING (auth.uid() = id);

-- Users can read their own payments
CREATE POLICY "Users read own payments"
    ON manin_payments FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert payments (backend)
CREATE POLICY "Service inserts payments"
    ON manin_payments FOR INSERT
    WITH CHECK (TRUE);

-- Users can read their own subscriptions
CREATE POLICY "Users read own subscriptions"
    ON manin_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage subscriptions
CREATE POLICY "Service manages subscriptions"
    ON manin_subscriptions FOR ALL
    WITH CHECK (TRUE);

-- Users can read their own scan logs
CREATE POLICY "Users read own scans"
    ON manin_scan_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Service can insert scan logs
CREATE POLICY "Service inserts scans"
    ON manin_scan_logs FOR INSERT
    WITH CHECK (TRUE);
