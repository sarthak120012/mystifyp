-- ============================================
-- COMPLETE FIX FOR ALL POSTING & INTERACTION ISSUES
-- Run this script in Supabase SQL Editor to fix:
-- 1. Text-only posts not working
-- 2. Likes auto-removing
-- 3. Comments not working
-- ============================================

-- STEP 1: Fix posts table to allow text-only posts
-- ================================================
ALTER TABLE posts 
ALTER COLUMN image_url DROP NOT NULL;

-- Ensure posts table has correct structure
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- STEP 2: Create LIKES table if it doesn't exist
-- ================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- STEP 3: Create COMMENTS table if it doesn't exist
-- ================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[], -- Array of usernames mentioned
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Enable RLS on new tables
-- ================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- STEP 5: Drop existing policies if any
-- ================================================
DROP POLICY IF EXISTS "Public likes" ON likes;
DROP POLICY IF EXISTS "User like" ON likes;
DROP POLICY IF EXISTS "User unlike" ON likes;
DROP POLICY IF EXISTS "Public comments" ON comments;
DROP POLICY IF EXISTS "User comment" ON comments;
DROP POLICY IF EXISTS "User delete own comment" ON comments;

-- STEP 6: Create PERMISSIVE policies for likes
-- ================================================
CREATE POLICY "Public likes" ON likes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "User like" ON likes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User unlike" ON likes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- STEP 7: Create PERMISSIVE policies for comments
-- ================================================
CREATE POLICY "Public comments" ON comments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "User comment" ON comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own comment" ON comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- STEP 8: Enable Real-time for likes and comments
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- STEP 9: Create triggers to update counts (OPTIONAL but recommended)
-- ================================================

-- Trigger to increment likes_count
CREATE OR REPLACE FUNCTION increment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET likes_count = likes_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_added
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION increment_likes_count();

-- Trigger to decrement likes_count
CREATE OR REPLACE FUNCTION decrement_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET likes_count = likes_count - 1 
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_removed
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION decrement_likes_count();

-- Trigger to increment comments_count
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET comments_count = comments_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_added
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION increment_comments_count();

-- Trigger to decrement comments_count
CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET comments_count = comments_count - 1 
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_removed
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION decrement_comments_count();

-- ============================================
-- VERIFICATION QUERIES (Run these after the script)
-- ============================================

-- Check if likes table exists
-- SELECT * FROM likes LIMIT 1;

-- Check if comments table exists
-- SELECT * FROM comments LIMIT 1;

-- Check if posts allows NULL image_url
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'posts' AND column_name = 'image_url';

-- ============================================
-- SUCCESS! All issues should now be fixed!
-- ============================================
