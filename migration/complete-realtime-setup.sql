-- Complete database setup for Realtime features and Events

-- 1. Fix Messages RLS Policies
DROP POLICY IF EXISTS "Users can read their messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

CREATE POLICY "Users can read their messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() IN (SELECT user_1 FROM matches WHERE id = match_id) OR 
    auth.uid() IN (SELECT user_2 FROM matches WHERE id = match_id)
  );

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND 
    (
      auth.uid() IN (SELECT user_1 FROM matches WHERE id = match_id) OR 
      auth.uid() IN (SELECT user_2 FROM matches WHERE id = match_id)
    )
  );

CREATE POLICY "Users can update their own seen status"
  ON messages FOR UPDATE
  USING (auth.uid() IN (SELECT user_1 FROM matches WHERE id = match_id) OR auth.uid() IN (SELECT user_2 FROM matches WHERE id = match_id))
  WITH CHECK (auth.uid() IN (SELECT user_1 FROM matches WHERE id = match_id) OR auth.uid() IN (SELECT user_2 FROM matches WHERE id = match_id));

-- 2. Create Events and Communities tables
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meetup', -- meetup, speed_dating, online
  location TEXT,
  event_date TIMESTAMP NOT NULL,
  max_participants INTEGER DEFAULT 20,
  interest_tags TEXT[] DEFAULT '{}',
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS interest_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES interest_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 3. Enable RLS for new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Events
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Hosts can manage their events" ON events FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "Anyone can read participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Users can join/leave events" ON event_participants FOR ALL USING (auth.uid() = user_id);

-- 5. RLS Policies for Rooms
CREATE POLICY "Anyone can read rooms" ON interest_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can read room members" ON room_members FOR SELECT USING (true);
CREATE POLICY "Users can join/leave rooms" ON room_members FOR ALL USING (auth.uid() = user_id);

-- 6. Enable Realtime
-- This is done by adding the tables to the supabase_realtime publication
-- Note: You might need to run this manually in the Supabase SQL editor if it's already created
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages, matches, posts, stories, events, event_participants, room_members;

-- If publication doesn't exist yet:
-- CREATE PUBLICATION supabase_realtime FOR TABLE messages, matches, posts, stories, events, event_participants, room_members;

-- 7. Storage Bucket for Profile Photos (Instructional)
-- CREATE BUCKET profile_photos;
