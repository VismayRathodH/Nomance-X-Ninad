-- Consolidated database setup for Nomance

-- Drop existing tables (if needed for cleanup)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS discovery_history CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS user_blocks CASCADE;
DROP TABLE IF EXISTS post_skips CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  birth_date DATE,
  gender TEXT,
  intent TEXT,
  values TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  quality_score INTEGER DEFAULT 100,
  mood TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for username search
CREATE INDEX idx_profiles_username ON profiles(username);

-- Create posts table (Auras)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  media_type TEXT DEFAULT 'image',
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create post_skips table
CREATE TABLE post_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create user_blocks table
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_1, user_2)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  seen_at TIMESTAMP
);

-- Create discovery_history table
CREATE TABLE discovery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discovered_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indices for better query performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_post_skips_user_id ON post_skips(user_id);
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX idx_matches_user_1 ON matches(user_1);
CREATE INDEX idx_matches_user_2 ON matches(user_2);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_discovery_history_user ON discovery_history(user_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Enable Row Level Security (RLS) for security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Posts Policies
CREATE POLICY "Public posts are readable"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Stories Policies
CREATE POLICY "Public stories are readable"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Post skips Policies
CREATE POLICY "Users can read their own post_skips"
  ON post_skips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post_skips"
  ON post_skips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User blocks Policies
CREATE POLICY "Users can read blocks involving them"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can insert their own blocks"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Matches Policies
CREATE POLICY "Users can read their matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_1 OR auth.uid() = user_2);

CREATE POLICY "Users can insert matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_1 OR auth.uid() = user_2);

CREATE POLICY "Users can update their matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_1 OR auth.uid() = user_2)
  WITH CHECK (auth.uid() = user_1 OR auth.uid() = user_2);

-- Messages Policies
CREATE POLICY "Users can read their messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Discovery history Policies
CREATE POLICY "Users can read their discovery history"
  ON discovery_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their discovery history"
  ON discovery_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reports Policies
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Functions
CREATE OR REPLACE FUNCTION public.increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, quality_score)
  VALUES (new.id, 100)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
