-- ============================================
-- ADD BLOCKS & REPORTS TABLES
-- Run this to enable reporting and blocking users
-- ============================================

-- 1. CREATE BLOCKS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id),
  CHECK (user_id != blocked_user_id)
);

-- 2. CREATE REPORTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  type TEXT NOT NULL, -- 'user' or 'post'
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
-- ================================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES
-- ================================================
DROP POLICY IF EXISTS "Users can view their blocks" ON blocks;
DROP POLICY IF EXISTS "Users can block others" ON blocks;
DROP POLICY IF EXISTS "Users can unblock" ON blocks;
DROP POLICY IF EXISTS "Users can view their reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;

-- 5. BLOCKS POLICIES
-- ================================================
CREATE POLICY "Users can view their blocks" 
ON blocks FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can block others" 
ON blocks FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock" 
ON blocks FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 6. REPORTS POLICIES
-- ================================================
CREATE POLICY "Users can view their reports" 
ON reports FOR SELECT 
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" 
ON reports FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- 7. UPDATE POSTS POLICIES FOR EDIT/DELETE
-- ================================================
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can update own posts" 
ON posts FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" 
ON posts FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- ✅ DONE! Now you can:
-- - Block/unblock users
-- - Report posts and users
-- - Edit your own posts
-- - Delete your own posts
-- ============================================
