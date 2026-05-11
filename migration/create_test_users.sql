-- Ensure pgcrypto is enabled (needed for encrypting passwords)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Create Test User 1
-- Email: test1@nomance.com
-- Password: password123
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    new_user_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'test1@nomance.com', 
    extensions.crypt('password123', extensions.gen_salt('bf')), 
    NOW(), 
    NOW(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Test User One"}', 
    NOW(), 
    NOW()
  );

  INSERT INTO public.profiles (id, full_name, bio, intent)
  VALUES (new_user_id, 'Test User One', 'Just testing the waters!', 'casual')
  ON CONFLICT (id) DO UPDATE 
  SET full_name = EXCLUDED.full_name, bio = EXCLUDED.bio, intent = EXCLUDED.intent;
END $$;

-- 2. Create Test User 2
-- Email: test2@nomance.com
-- Password: password123
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    new_user_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'test2@nomance.com', 
    extensions.crypt('password123', extensions.gen_salt('bf')), 
    NOW(), 
    NOW(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Test User Two"}', 
    NOW(), 
    NOW()
  );

  INSERT INTO public.profiles (id, full_name, bio, intent)
  VALUES (new_user_id, 'Test User Two', 'Looking for something serious.', 'serious')
  ON CONFLICT (id) DO UPDATE 
  SET full_name = EXCLUDED.full_name, bio = EXCLUDED.bio, intent = EXCLUDED.intent;
END $$;
