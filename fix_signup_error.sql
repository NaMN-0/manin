-- ============================================================
-- FIX SIGNUP ERROR: "Database error saving new user"
-- ============================================================

-- 1. Ensure public.manin_users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.manin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_pro BOOLEAN DEFAULT FALSE,
    pro_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Additional columns from migrations (ensure they exist)
    plan TEXT DEFAULT NULL,
    valid_until TIMESTAMPTZ DEFAULT NULL,
    has_used_trial BOOLEAN DEFAULT FALSE,
    combat_style TEXT DEFAULT 'ronin',
    user_profile JSONB DEFAULT '{}'::jsonb
);

-- 2. Drop the potentially broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.manin_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.manin_users (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
        
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the detailed error to Postgres logs
    RAISE LOG 'Error in manin_handle_new_user trigger: %', SQLERRM;
    -- Reraise generic error or specific one if desired, but logging is key.
    -- If we swallow the error, the user is created in auth.users but NOT in manin_users.
    -- This might allow login but profile will be missing.
    -- Better to fail loudly or swallow?
    -- "Database error saving new user" comes from unhandled exception. 
    -- Let's try to SWALLOW the error and log it, so signup SUCCEEDS even if profile creation fails?
    -- No, that leads to inconsistent state.
    -- Let's log and re-raise a cleaner message.
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.manin_handle_new_user();

-- 5. Grant permissions (just in case)
GRANT ALL ON TABLE public.manin_users TO postgres;
GRANT ALL ON TABLE public.manin_users TO service_role;
GRANT SELECT, UPDATE ON TABLE public.manin_users TO authenticated;
GRANT INSERT ON TABLE public.manin_users TO service_role; -- Ensure service role can insert

-- 6. Verify by selecting from manin_users (optional)
SELECT count(*) FROM public.manin_users;
