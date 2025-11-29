-- ============================================
-- MASTER FIX SCRIPT - RUN THIS TO FIX EVERYTHING
-- ============================================

-- 1. FIX MISSING PROFILES (Robust Version)
DO $$
DECLARE
  r RECORD;
  v_username text;
BEGIN
  FOR r IN SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM profiles) LOOP
    v_username := COALESCE(r.raw_user_meta_data->>'username', 'user_' || substr(r.id::text, 1, 8));
    
    -- Handle duplicate usernames
    IF EXISTS (SELECT 1 FROM profiles WHERE username = v_username) THEN
        v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
    END IF;

    INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
    VALUES (
      r.id,
      v_username,
      COALESCE(r.raw_user_meta_data->>'full_name', 'User'),
      r.created_at,
      r.updated_at
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 2. FORCE DROP ALL EXISTING POLICIES
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- 3. ENABLE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. CREATE PERMISSIVE POLICIES (Fixes "new row violates..." errors)

-- PROFILES
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "User update profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "User insert profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- POSTS
CREATE POLICY "Public posts" ON posts FOR SELECT USING (true);
CREATE POLICY "User create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User delete posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS
CREATE POLICY "Public follows" ON follows FOR SELECT USING (true);
CREATE POLICY "User create follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "User delete follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- NOTIFICATIONS
CREATE POLICY "User view notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "User update notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User delete notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "User view messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "User send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. VERIFY
SELECT count(*) as profile_count FROM profiles;
