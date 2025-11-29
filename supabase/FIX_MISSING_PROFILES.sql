-- ============================================
-- FIX: Foreign Key Constraint Error on Posts
-- ROBUST VERSION: Handles duplicate usernames
-- ============================================

-- Step 1: Create profiles for any users that don't have one
-- Uses a DO block to handle username collisions safely
DO $$
DECLARE
  r RECORD;
  v_username text;
  v_base_username text;
BEGIN
  FOR r IN 
    SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM profiles)
  LOOP
    -- Determine base username
    v_base_username := COALESCE(r.raw_user_meta_data->>'username', 'user_' || substr(r.id::text, 1, 8));
    v_username := v_base_username;
    
    -- Check if username exists, if so, append random suffix
    IF EXISTS (SELECT 1 FROM profiles WHERE username = v_username) THEN
        v_username := v_base_username || '_' || substr(md5(random()::text), 1, 4);
    END IF;

    -- Attempt insert
    BEGIN
      INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
      VALUES (
        r.id,
        v_username,
        COALESCE(r.raw_user_meta_data->>'full_name', 'User'),
        r.created_at,
        r.updated_at
      );
    EXCEPTION WHEN unique_violation THEN
      -- Fallback if even the randomized one failed (extremely unlikely)
      -- Just use the user ID as the username
      INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
      VALUES (
        r.id,
        'user_' || substr(r.id::text, 1, 12),
        COALESCE(r.raw_user_meta_data->>'full_name', 'User'),
        r.created_at,
        r.updated_at
      );
    END;
  END LOOP;
END $$;

-- Step 2: Create or replace the trigger function to auto-create profiles
-- Updated to handle collisions automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
BEGIN
  v_username := COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8));
  
  -- Simple check for collision, if exists, append random
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
  END IF;

  INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
  VALUES (
    new.id,
    v_username,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify all users have profiles now
SELECT 
  u.id as user_id,
  u.email,
  p.username,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
