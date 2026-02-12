
-- RESET USER SUBSCRIPTIONS
-- Run this in the Supabase SQL Editor

-- 1. Reset public.manin_users
UPDATE public.manin_users
SET 
    is_pro = FALSE,
    plan = NULL,
    valid_until = NULL,
    updated_at = NOW();

-- 2. Clear payments (Optional: if you want a truly clean slate)
-- DELETE FROM public.manin_payments;

-- 3. Reset auth.users metadata (Requires admin privileges or a script)
-- Note: You cannot easily update auth.users from the SQL editor in some Supabase configurations due to permissions.
-- However, if you are the project owner, this might work:

UPDATE auth.users
SET raw_app_meta_data = 
  jsonb_set(
    jsonb_set(raw_app_meta_data, '{subscription_status}', '"inactive"'),
    '{plan}', 'null'
  );

-- 4. Check results
SELECT user_id, email, is_pro, plan FROM public.manin_users LIMIT 10;
