-- ============================================
-- SAFE FIX FOR TEXT-ONLY POSTS & INTERACTIONS
-- This script is safe to run multiple times
-- ============================================

-- STEP 1: Allow text-only posts (image_url can be NULL)
-- ================================================
ALTER TABLE posts 
ALTER COLUMN image_url DROP NOT NULL;

-- STEP 2: Ensure count columns exist
-- ================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='likes_count') THEN
        ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='comments_count') THEN
        ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- STEP 3: Create LIKES table if it doesn't exist
-- ================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- STEP 4: Create COMMENTS table if it doesn't exist
-- ================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: Enable RLS
-- ================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- STEP 6: Recreate policies (drop first to avoid duplicates)
-- ================================================
DROP POLICY IF EXISTS "Public likes" ON likes;
DROP POLICY IF EXISTS "User like" ON likes;
DROP POLICY IF EXISTS "User unlike" ON likes;
DROP POLICY IF EXISTS "Public comments" ON comments;
DROP POLICY IF EXISTS "User comment" ON comments;
DROP POLICY IF EXISTS "User delete own comment" ON comments;

CREATE POLICY "Public likes" ON likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "User like" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User unlike" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Public comments" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "User comment" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User delete own comment" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- STEP 7: Add to real-time (SKIP if already exists)
-- ================================================
-- Run these manually if they fail:
-- ALTER PUBLICATION supabase_realtime ADD TABLE likes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- STEP 8: Create/Replace triggers for auto-counting
-- ================================================

-- Likes count triggers
CREATE OR REPLACE FUNCTION increment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_like_added ON likes;
CREATE TRIGGER on_like_added AFTER INSERT ON likes FOR EACH ROW EXECUTE FUNCTION increment_likes_count();

DROP TRIGGER IF EXISTS on_like_removed ON likes;
CREATE TRIGGER on_like_removed AFTER DELETE ON likes FOR EACH ROW EXECUTE FUNCTION decrement_likes_count();

-- Comments count triggers
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_added ON comments;
CREATE TRIGGER on_comment_added AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

DROP TRIGGER IF EXISTS on_comment_removed ON comments;
CREATE TRIGGER on_comment_removed AFTER DELETE ON comments FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();

-- ============================================
-- ✅ DONE! Now test:
-- 1. Text-only posts should work
-- 2. Likes should stick
-- 3. Comments should work
-- ============================================
