-- ============================================
-- ADD DATE OF BIRTH TO PROFILES
-- ============================================

-- 1. Add date_of_birth column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Make full_name nullable (since we are removing it from onboarding)
ALTER TABLE profiles 
ALTER COLUMN full_name DROP NOT NULL;

-- 3. Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'date_of_birth';
