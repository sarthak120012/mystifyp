-- ============================================
-- ADD MISSING TABLES & COLUMNS
-- ============================================

-- 1. Add date_of_birth to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE profiles 
ALTER COLUMN full_name DROP NOT NULL;

-- 2. Create LIKES table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 3. Create COMMENTS table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[], -- Array of usernames mentioned
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- Likes
CREATE POLICY "Public likes" ON likes FOR SELECT USING (true);
CREATE POLICY "User like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Public comments" ON comments FOR SELECT USING (true);
CREATE POLICY "User comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User delete own comment" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
