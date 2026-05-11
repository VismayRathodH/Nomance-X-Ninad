-- Add bio column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add username column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username search if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
