-- ============================================================
-- Manin — Pro Features & Profiles
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. Add Combat Style and Extended Profile to 'manin_users'
ALTER TABLE public.manin_users
ADD COLUMN IF NOT EXISTS combat_style TEXT DEFAULT 'ronin', -- 'genin', 'jonin', 'kage' (or 'ronin' for unset)
ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::jsonb;

-- 2. Update RLS policies to allow update of these columns
-- (Existing "Users update own profile" policy should cover this, but ensuring explicit grants if needed)
GRANT UPDATE (combat_style, user_profile) ON public.manin_users TO authenticated;
