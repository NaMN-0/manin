-- ============================================================
-- Manin — GAMIFICATION & SCHEMA FIX
-- Run this in Supabase → SQL Editor to fix 400 Errors
-- ============================================================

-- 1. Ensure 'xp' and 'virtual_cash' exist
ALTER TABLE public.manin_users 
ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS virtual_cash NUMERIC DEFAULT 100000.0,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS combat_style TEXT DEFAULT 'ronin',
ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::jsonb;

-- 2. Update the trigger function to handle new users correctly
CREATE OR REPLACE FUNCTION public.manin_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.manin_users (id, email, full_name, avatar_url, xp, virtual_cash, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url',
        0,
        100000.0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant verify permissions
GRANT UPDATE (xp, virtual_cash, user_profile, combat_style) ON public.manin_users TO authenticated;
GRANT SELECT ON public.manin_users TO authenticated;

-- 4. Verify contents
SELECT id, email, xp, virtual_cash FROM public.manin_users LIMIT 5;
