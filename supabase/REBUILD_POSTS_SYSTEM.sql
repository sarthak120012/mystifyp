-- ============================================
-- ☢️ NUCLEAR REBUILD OF POSTING SYSTEM ☢️
-- This script completely rebuilds the posts table and permissions
-- to guarantee posting works for everyone.
-- ============================================

-- 1. DROP EVERYTHING RELATED TO POSTS
DROP TABLE IF EXISTS posts CASCADE;

-- 2. RECREATE POSTS TABLE (Clean Schema)
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Link to profiles for easy joining
  caption TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. CREATE "OPEN" POLICIES (Guaranteed Access)

-- Allow ANYONE to view posts (Public Feed)
CREATE POLICY "Public View" 
ON posts FOR SELECT 
USING (true);

-- Allow AUTHENTICATED users to create posts
CREATE POLICY "Auth Create" 
ON posts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to delete THEIR OWN posts
CREATE POLICY "Owner Delete" 
ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- 5. ENABLE REAL-TIME
-- This ensures the feed updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- 6. FIX PROFILES (Just in case)
-- Ensure every user has a profile so the join works
INSERT INTO profiles (id, username, full_name)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
  COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 7. VERIFY SETUP
SELECT 
  table_name, 
  (SELECT count(*) FROM pg_policies WHERE tablename = 'posts') as policy_count
FROM information_schema.tables 
WHERE table_name = 'posts';
