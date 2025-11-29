-- ============================================
-- STORAGE BUCKETS CONFIGURATION
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('posts', 'posts', true),
  ('avatars', 'avatars', true),
  ('private_vault', 'private_vault', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Posts Bucket Policies
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own post images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars Bucket Policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Private Vault Bucket Policies (STRICT)
CREATE POLICY "Users can ONLY view own vault files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'private_vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to own vault"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'private_vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own vault files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'private_vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own vault files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'private_vault' AND auth.uid()::text = (storage.foldername(name))[1]);
