-- Add has_used_trial column to manin_users for one-time Pro feature access
ALTER TABLE public.manin_users 
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

-- Reset trial for everyone if needed (optional, for testing)
-- UPDATE public.manin_users SET has_used_trial = FALSE;
