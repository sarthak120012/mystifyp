-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_pins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles (unless private)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- FOLLOWS POLICIES
-- ============================================

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- BLOCKS POLICIES
-- ============================================

CREATE POLICY "Users can view their blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================
-- REPORTS POLICIES
-- ============================================

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- POSTS POLICIES
-- ============================================

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- LIKES POLICIES
-- ============================================

CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS POLICIES
-- ============================================

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES POLICIES
-- ============================================

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- TYPING INDICATORS POLICIES
-- ============================================

CREATE POLICY "Users can view typing indicators"
  ON typing_indicators FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = chat_partner_id);

CREATE POLICY "Users can update typing status"
  ON typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own typing"
  ON typing_indicators FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ONLINE STATUS POLICIES
-- ============================================

CREATE POLICY "Online status is viewable by everyone"
  ON online_status FOR SELECT
  USING (true);

CREATE POLICY "Users can update own status"
  ON online_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own online status"
  ON online_status FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- GAME ROOMS POLICIES
-- ============================================

CREATE POLICY "Game rooms are viewable by participants"
  ON game_rooms FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id OR status = 'waiting');

CREATE POLICY "Users can create game rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their game rooms"
  ON game_rooms FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- ============================================
-- GAME MOVES POLICIES
-- ============================================

CREATE POLICY "Game moves are viewable by participants"
  ON game_moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_rooms
      WHERE id = room_id
      AND (host_id = auth.uid() OR guest_id = auth.uid())
    )
  );

CREATE POLICY "Players can create moves"
  ON game_moves FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- ============================================
-- LEADERBOARD POLICIES
-- ============================================

CREATE POLICY "Leaderboard is viewable by everyone"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own leaderboard entry"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VAULT ITEMS POLICIES (STRICT)
-- ============================================

CREATE POLICY "Users can ONLY view own vault items"
  ON vault_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create vault items"
  ON vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault items"
  ON vault_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items"
  ON vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VAULT PINS POLICIES
-- ============================================

CREATE POLICY "Users can view own vault pin"
  ON vault_pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create vault PIN"
  ON vault_pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault PIN"
  ON vault_pins FOR UPDATE
  USING (auth.uid() = user_id);
