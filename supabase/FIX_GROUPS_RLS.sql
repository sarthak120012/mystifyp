-- ============================================
-- FIX GROUPS RLS - Run this in Supabase SQL Editor
-- ============================================

-- Fix "Members can add members" policy to allow Admins to add members (including themselves)
DROP POLICY IF EXISTS "Members can add members" ON group_members;

CREATE POLICY "Admins and Members can add members" ON group_members 
  FOR INSERT WITH CHECK (
    -- Allow if user is the Admin of the group
    group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid())
    OR
    -- Allow if user is already a member (for future "anyone can add" feature)
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Ensure Group Messages can be inserted by Admin even if not in group_members yet (for the system message)
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;

CREATE POLICY "Members and Admins can send messages" ON group_messages 
  FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid())
    OR
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
