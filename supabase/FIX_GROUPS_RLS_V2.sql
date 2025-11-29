-- ============================================
-- FIX GROUPS RLS V2 - Run this in Supabase SQL Editor
-- ============================================

-- 1. Allow Admins to VIEW their own groups (Critical for creation flow)
-- Previous policy only allowed members to view. But when creating, you aren't a member yet.
DROP POLICY IF EXISTS "Members can view groups" ON groups;
DROP POLICY IF EXISTS "Members and Admins can view groups" ON groups;

CREATE POLICY "Members and Admins can view groups" ON groups 
  FOR SELECT USING (
    auth.uid() = admin_id OR
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = id)
  );

-- 2. Allow Admins to add members
DROP POLICY IF EXISTS "Members can add members" ON group_members;
DROP POLICY IF EXISTS "Admins and Members can add members" ON group_members;

CREATE POLICY "Admins and Members can add members" ON group_members 
  FOR INSERT WITH CHECK (
    -- Allow if user is the Admin of the group
    group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid())
    OR
    -- Allow if user is already a member
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- 3. Allow Admins to send messages (for system messages)
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Members and Admins can send messages" ON group_messages;

CREATE POLICY "Members and Admins can send messages" ON group_messages 
  FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid())
    OR
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
