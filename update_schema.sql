
-- SCHEMA MIGRATION & RESET
-- Run this entire script in the Supabase SQL Editor

-- 1. Add missing columns to 'manin_users'
ALTER TABLE public.manin_users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ DEFAULT NULL;

-- 2. Add missing columns to 'manin_payments'
ALTER TABLE public.manin_payments
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;

-- 3. RESET USER SUBSCRIPTIONS
UPDATE public.manin_users
SET 
    is_pro = FALSE,
    plan = NULL,
    valid_until = NULL,
    updated_at = NOW();

-- 4. Reset auth.users metadata (Administrator only)
DO $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    jsonb_set(
      jsonb_set(raw_app_meta_data, '{subscription_status}', '"inactive"'),
      '{plan}', 'null'
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update auth.users metadata. Code: %', SQLSTATE;
END $$;

-- 5. Create cache table for Market Overview
CREATE TABLE IF NOT EXISTS public.cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for cache
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service_role full access" ON public.cache FOR ALL TO service_role USING (true);

-- 6. Verify Structure (Using 'id' not 'user_id')
SELECT id, email, is_pro, plan FROM public.manin_users LIMIT 5;
