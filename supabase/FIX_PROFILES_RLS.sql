-- ============================================
-- FIX PROFILES VISIBILITY - Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix Profiles RLS
-- Ensure everyone can see profiles (needed for leaderboard)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Fix Leaderboard RLS (Just in case)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view leaderboard" ON leaderboard;
CREATE POLICY "Public view leaderboard" ON leaderboard FOR SELECT USING (true);

DROP POLICY IF EXISTS "System update leaderboard" ON leaderboard;
CREATE POLICY "System update leaderboard" ON leaderboard FOR ALL USING (true);

-- 3. Verify Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'leaderboard'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
  END IF;
END $$;
