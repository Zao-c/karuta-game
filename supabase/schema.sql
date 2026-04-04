-- Karuta Game Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name VARCHAR(50) NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  game_mode INTEGER DEFAULT 0,
  game_phase INTEGER DEFAULT 0,
  deck_type VARCHAR(20),
  deck_cards JSONB,
  custom_cards JSONB,
  current_character_id VARCHAR(50),
  current_quote TEXT,
  turn_start_time TIMESTAMP WITH TIME ZONE,
  paused BOOLEAN DEFAULT FALSE,
  paused_time_remaining INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_ended_at TIMESTAMP WITH TIME ZONE
);

-- Room players table
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(50) NOT NULL,
  avatar TEXT,
  is_host BOOLEAN DEFAULT FALSE,
  is_observer BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  combo INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  total_reaction_time INTEGER DEFAULT 0,
  seat_index INTEGER DEFAULT 0,
  deck JSONB,
  collected JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pick events table
CREATE TABLE IF NOT EXISTS pick_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
  card_id VARCHAR(50) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  reaction_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decks table (for custom card decks)
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cards JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Song libraries table (for guess song mode)
CREATE TABLE IF NOT EXISTS song_libraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  songs JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_pick_events_room_id ON pick_events(room_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_song_libraries_user_id ON song_libraries(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_libraries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for rooms table
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Room host can update rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Room host can update rooms" ON rooms FOR UPDATE USING (auth.uid() = host_id OR host_id IS NULL);
CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE USING (true);

-- RLS Policies for room_players table
DROP POLICY IF EXISTS "Room players are viewable by everyone" ON room_players;
DROP POLICY IF EXISTS "Anyone can insert room players" ON room_players;
DROP POLICY IF EXISTS "Players can update own record" ON room_players;
DROP POLICY IF EXISTS "Anyone can delete room players" ON room_players;
CREATE POLICY "Room players are viewable by everyone" ON room_players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert room players" ON room_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update own record" ON room_players FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete room players" ON room_players FOR DELETE USING (true);

-- RLS Policies for pick_events table
DROP POLICY IF EXISTS "Pick events are viewable by everyone" ON pick_events;
DROP POLICY IF EXISTS "Anyone can insert pick events" ON pick_events;
CREATE POLICY "Pick events are viewable by everyone" ON pick_events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pick events" ON pick_events FOR INSERT WITH CHECK (true);

-- RLS Policies for decks table
DROP POLICY IF EXISTS "Public decks are viewable by everyone" ON decks;
DROP POLICY IF EXISTS "Users can insert own decks" ON decks;
DROP POLICY IF EXISTS "Users can update own decks" ON decks;
DROP POLICY IF EXISTS "Users can delete own decks" ON decks;
CREATE POLICY "Public decks are viewable by everyone" ON decks FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own decks" ON decks FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own decks" ON decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decks" ON decks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for song_libraries table
DROP POLICY IF EXISTS "Public song libraries are viewable by everyone" ON song_libraries;
DROP POLICY IF EXISTS "Users can insert own song libraries" ON song_libraries;
DROP POLICY IF EXISTS "Users can update own song libraries" ON song_libraries;
DROP POLICY IF EXISTS "Users can delete own song libraries" ON song_libraries;
CREATE POLICY "Public song libraries are viewable by everyone" ON song_libraries FOR SELECT USING (true);
CREATE POLICY "Users can insert own song libraries" ON song_libraries FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own song libraries" ON song_libraries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own song libraries" ON song_libraries FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;
CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_song_libraries_updated_at ON song_libraries;
CREATE TRIGGER update_song_libraries_updated_at
  BEFORE UPDATE ON song_libraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate random room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-cleanup old rooms
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms 
  WHERE game_ended_at IS NOT NULL 
  AND game_ended_at < NOW() - INTERVAL '5 minutes';
  
  DELETE FROM rooms 
  WHERE created_at < NOW() - INTERVAL '10 minutes'
  AND game_phase = 0;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for rooms and room_players tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pick_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Storage policies for uploaded assets
DROP POLICY IF EXISTS "Anyone can read song audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload song audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update song audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete song audio" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can read cover images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload cover images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update cover images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete cover images" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

CREATE POLICY "Anyone can read song audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'song-audio');

CREATE POLICY "Authenticated users can upload song audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'song-audio');

CREATE POLICY "Authenticated users can update song audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'song-audio')
WITH CHECK (bucket_id = 'song-audio');

CREATE POLICY "Authenticated users can delete song audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'song-audio');

CREATE POLICY "Anyone can read cover images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cover-images');

CREATE POLICY "Authenticated users can upload cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cover-images');

CREATE POLICY "Authenticated users can update cover images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'cover-images')
WITH CHECK (bucket_id = 'cover-images');

CREATE POLICY "Authenticated users can delete cover images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cover-images');

CREATE POLICY "Anyone can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Create a view for room list with player count
CREATE OR REPLACE VIEW room_list_view AS
SELECT 
  r.id,
  r.code,
  r.host_id,
  r.game_mode,
  r.game_phase,
  r.deck_type,
  r.created_at,
  r.game_ended_at,
  u.display_name as host_name,
  COUNT(rp.id) as player_count
FROM rooms r
LEFT JOIN users u ON r.host_id = u.id
LEFT JOIN room_players rp ON r.id = rp.room_id
GROUP BY r.id, u.display_name;

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES room_players(id) ON DELETE SET NULL,
  player_name VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- RLS Policies for chat_messages table
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;
CREATE POLICY "Chat messages are viewable by everyone" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Enable realtime for chat_messages
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
