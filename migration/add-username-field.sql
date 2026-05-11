-- Add username field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username search
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
