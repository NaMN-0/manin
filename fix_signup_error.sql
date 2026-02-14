-- ============================================================
-- FIX SIGNUP ERROR: STRATEGY SHIFT -> DISABLE TRIGGER
-- ============================================================

-- 1. Ensure public.manin_users table exists with correct schema (Idempotent)
CREATE TABLE IF NOT EXISTS public.manin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_pro BOOLEAN DEFAULT FALSE,
    pro_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    plan TEXT DEFAULT NULL,
    valid_until TIMESTAMPTZ DEFAULT NULL,
    has_used_trial BOOLEAN DEFAULT FALSE,
    combat_style TEXT DEFAULT 'ronin',
    user_profile JSONB DEFAULT '{}'::jsonb
);

-- 2. Safely add columns if they don't exist (Idempotent)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.manin_users ADD COLUMN plan TEXT DEFAULT NULL;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column plan already exists in manin_users.';
    END;
    BEGIN
        ALTER TABLE public.manin_users ADD COLUMN valid_until TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column valid_until already exists in manin_users.';
    END;
    BEGIN
        ALTER TABLE public.manin_users ADD COLUMN has_used_trial BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column has_used_trial already exists in manin_users.';
    END;
    BEGIN
        ALTER TABLE public.manin_users ADD COLUMN combat_style TEXT DEFAULT 'ronin';
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column combat_style already exists in manin_users.';
    END;
    BEGIN
        ALTER TABLE public.manin_users ADD COLUMN user_profile JSONB DEFAULT '{}'::jsonb;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column user_profile already exists in manin_users.';
    END;
END;
$$;

-- 3. DROP THE TRIGGER AND FUNCTION to unblock signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.manin_handle_new_user();

-- 4. Grant permissions (ensure API can write to it)
GRANT ALL ON TABLE public.manin_users TO postgres;
GRANT ALL ON TABLE public.manin_users TO service_role;
GRANT SELECT, UPDATE, INSERT ON TABLE public.manin_users TO authenticated;
GRANT ALL ON TABLE public.manin_users TO service_role;

-- 5. Verify
SELECT count(*) FROM public.manin_users;
