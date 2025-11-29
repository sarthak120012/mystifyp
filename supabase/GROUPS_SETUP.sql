-- ============================================
-- GROUPS SETUP - Run this in Supabase SQL Editor
-- ============================================

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. GROUP MESSAGES TABLE
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Nullable for system messages
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'system', 'image'
  read_by JSONB DEFAULT '[]', -- Array of user_ids who read the message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- Groups
CREATE POLICY "Members can view groups" ON groups 
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = id)
  );

CREATE POLICY "Users can create groups" ON groups 
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admin can update groups" ON groups 
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Admin can delete groups" ON groups 
  FOR DELETE USING (auth.uid() = admin_id);

-- Group Members
CREATE POLICY "Members can view members" ON group_members 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can add members" ON group_members 
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can remove members" ON group_members 
  FOR DELETE USING (
    group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid())
    OR user_id = auth.uid() -- Users can leave
  );

-- Group Messages
CREATE POLICY "Members can view messages" ON group_messages 
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON group_messages 
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);

-- 7. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE groups;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
  END IF;
END $$;
