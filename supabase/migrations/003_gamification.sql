-- Add XP and Virtual Cash columns to manin_users
ALTER TABLE manin_users 
ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS virtual_cash NUMERIC DEFAULT 100000.0;

-- Update the handle_new_user function to ensure defaults are set (though columns handle it)
-- This also serves as a way to "refresh" the trigger logic if needed.
CREATE OR REPLACE FUNCTION manin_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO manin_users (id, email, full_name, avatar_url, xp, virtual_cash)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url',
        0,
        100000.0
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
