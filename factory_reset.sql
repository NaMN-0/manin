-- ============================================================
-- Manin — FACTORY RESET (Nuclear Option)
-- ⚠️  THIS WILL DELETE ALL USER AND PAYMENT DATA!
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. Clear all scan logs
TRUNCATE TABLE public.manin_scan_logs CASCADE;

-- 2. Clear all subscriptions
TRUNCATE TABLE public.manin_subscriptions CASCADE;

-- 3. Clear all payments
TRUNCATE TABLE public.manin_payments CASCADE;

-- 4. Clear all user profiles (this keeps auth.users intact)
TRUNCATE TABLE public.manin_users CASCADE;

-- 5. Reset auth metadata (Pro status)
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

-- 6. Verify
SELECT 'manin_users' AS tbl, count(*) FROM public.manin_users
UNION ALL
SELECT 'manin_payments', count(*) FROM public.manin_payments
UNION ALL
SELECT 'manin_subscriptions', count(*) FROM public.manin_subscriptions
UNION ALL
SELECT 'manin_scan_logs', count(*) FROM public.manin_scan_logs;
