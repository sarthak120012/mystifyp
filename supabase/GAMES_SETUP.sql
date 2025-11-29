-- ============================================
-- GAMES SETUP - Run this in Supabase SQL Editor
-- ============================================

-- 1. GAME ROOMS TABLE
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users(id) NOT NULL,
  guest_id UUID REFERENCES auth.users(id),
  game_type TEXT NOT NULL, -- 'tictactoe', 'taprace', 'memoryflip', 'bingo', 'numberbattle'
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAME MOVES TABLE
CREATE TABLE IF NOT EXISTS game_moves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users(id) NOT NULL,
  move_number INTEGER NOT NULL,
  game_state JSONB NOT NULL, -- Flexible JSON for different games
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LEADERBOARD TABLE
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  points INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. ENABLE RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES (Drop first to avoid errors)

-- Game Rooms
DROP POLICY IF EXISTS "Public view rooms" ON game_rooms;
CREATE POLICY "Public view rooms" ON game_rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth create rooms" ON game_rooms;
CREATE POLICY "Auth create rooms" ON game_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Players update rooms" ON game_rooms;
CREATE POLICY "Players update rooms" ON game_rooms FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

DROP POLICY IF EXISTS "Host delete rooms" ON game_rooms;
CREATE POLICY "Host delete rooms" ON game_rooms FOR DELETE USING (auth.uid() = host_id);

-- Game Moves
DROP POLICY IF EXISTS "Public view moves" ON game_moves;
CREATE POLICY "Public view moves" ON game_moves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players create moves" ON game_moves;
CREATE POLICY "Players create moves" ON game_moves FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Players delete moves" ON game_moves;
CREATE POLICY "Players delete moves" ON game_moves FOR DELETE USING (true);

-- Leaderboard
DROP POLICY IF EXISTS "Public view leaderboard" ON leaderboard;
CREATE POLICY "Public view leaderboard" ON leaderboard FOR SELECT USING (true);

DROP POLICY IF EXISTS "System update leaderboard" ON leaderboard;
CREATE POLICY "System update leaderboard" ON leaderboard FOR ALL USING (true);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_moves_room ON game_moves(room_id);

-- 7. ENABLE REALTIME (Critical for multiplayer)
-- Note: This might fail if already added, but usually safe to run.
-- If it fails, you can ignore or run manually in Table Editor -> Replication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'game_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'game_moves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_moves;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'leaderboard'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
  END IF;
END $$;
