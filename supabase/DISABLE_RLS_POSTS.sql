-- ============================================
-- 🔓 DISABLE RLS ON POSTS (DEBUGGING)
-- Run this if you STILL cannot post.
-- This removes all permission checks for posts.
-- ============================================

-- 1. Disable RLS on posts table
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 2. Grant full access to authenticated users (just in case)
GRANT ALL ON posts TO authenticated;
GRANT ALL ON posts TO public;

-- 3. Verify Profile Exists (Again)
INSERT INTO profiles (id, username, full_name)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
  COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Check status
SELECT 'RLS DISABLED' as status, count(*) as post_count FROM posts;
