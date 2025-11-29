-- ============================================
-- FIX GROUPS RECURSION - Run this in Supabase SQL Editor
-- ============================================

-- The "infinite recursion" error happens because the RLS policy for group_members
-- tries to query group_members to check permissions, creating a loop.
-- We fix this by using "SECURITY DEFINER" functions which bypass RLS for the check.

-- 1. Create a secure function to check membership (bypasses RLS)
CREATE OR REPLACE FUNCTION is_group_member(_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = _group_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a secure function to check admin status
CREATE OR REPLACE FUNCTION is_group_admin(_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM groups 
    WHERE id = _group_id AND admin_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update group_members policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members Select" ON group_members;
CREATE POLICY "Members Select" ON group_members FOR SELECT USING (
  is_group_admin(group_id) OR is_group_member(group_id)
);

DROP POLICY IF EXISTS "Members Insert" ON group_members;
CREATE POLICY "Members Insert" ON group_members FOR INSERT WITH CHECK (
  is_group_admin(group_id)
);

DROP POLICY IF EXISTS "Members Delete" ON group_members;
CREATE POLICY "Members Delete" ON group_members FOR DELETE USING (
  is_group_admin(group_id) OR user_id = auth.uid()
);

-- 4. Update groups policies (just to be safe and clean)
DROP POLICY IF EXISTS "Groups Select" ON groups;
CREATE POLICY "Groups Select" ON groups FOR SELECT USING (
  admin_id = auth.uid() OR is_group_member(id)
);

-- 5. Update messages policies
DROP POLICY IF EXISTS "Messages Select" ON group_messages;
CREATE POLICY "Messages Select" ON group_messages FOR SELECT USING (
  is_group_admin(group_id) OR is_group_member(group_id)
);

DROP POLICY IF EXISTS "Messages Insert" ON group_messages;
CREATE POLICY "Messages Insert" ON group_messages FOR INSERT WITH CHECK (
  is_group_admin(group_id) OR is_group_member(group_id)
);
