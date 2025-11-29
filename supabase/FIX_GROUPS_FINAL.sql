-- ============================================
-- FIX GROUPS FINAL - Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension just in case
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESET GROUPS POLICIES
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Members can view groups" ON groups;
DROP POLICY IF EXISTS "Members and Admins can view groups" ON groups;
DROP POLICY IF EXISTS "Admin can update groups" ON groups;
DROP POLICY IF EXISTS "Admin can delete groups" ON groups;
DROP POLICY IF EXISTS "Enable all access for admin" ON groups;

-- Allow INSERT if you are the admin
CREATE POLICY "Groups Insert" ON groups FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Allow SELECT if you are Admin OR Member
CREATE POLICY "Groups Select" ON groups FOR SELECT USING (
  auth.uid() = admin_id OR 
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Allow UPDATE/DELETE if you are Admin
CREATE POLICY "Groups Update" ON groups FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Groups Delete" ON groups FOR DELETE USING (auth.uid() = admin_id);


-- 2. RESET MEMBERS POLICIES
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view members" ON group_members;
DROP POLICY IF EXISTS "Members can add members" ON group_members;
DROP POLICY IF EXISTS "Admins and Members can add members" ON group_members;
DROP POLICY IF EXISTS "Admin can remove members" ON group_members;

-- Allow SELECT if you are Admin of the group OR a Member of the group
CREATE POLICY "Members Select" ON group_members FOR SELECT USING (
  group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()) OR
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Allow INSERT if you are Admin of the group
CREATE POLICY "Members Insert" ON group_members FOR INSERT WITH CHECK (
  group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid())
);

-- Allow DELETE if you are Admin (kick) OR it's yourself (leave)
CREATE POLICY "Members Delete" ON group_members FOR DELETE USING (
  group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()) OR
  user_id = auth.uid()
);


-- 3. RESET MESSAGES POLICIES
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Members and Admins can send messages" ON group_messages;

-- Allow SELECT if Admin or Member
CREATE POLICY "Messages Select" ON group_messages FOR SELECT USING (
  group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()) OR
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Allow INSERT if Admin or Member
CREATE POLICY "Messages Insert" ON group_messages FOR INSERT WITH CHECK (
  group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()) OR
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
