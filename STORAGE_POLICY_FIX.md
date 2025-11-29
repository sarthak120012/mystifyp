# Storage Bucket Policy Fix Guide

## ❌ Problem: 406 Errors on Images

The errors like `rtuwmosbodkgibickf1f...` returning 406 mean storage bucket policies are blocking image access.

---

## ✅ Solution: Fix Storage Policies

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project
2. Click **Storage** in left sidebar
3. You should see buckets: `avatars`, `posts`, `vault-photos`, `vault-voice`

---

### Step 2: Fix `avatars` Bucket

1. Click on **avatars** bucket
2. Click **Policies** tab
3. Delete ALL existing policies
4. Create these 3 new policies:

#### Policy 1: Public Read
- **Name:** `Public can view avatars`
- **Policy Command:** `SELECT`
- **Target roles:** `public`
- **USING expression:** 
  ```sql
  true
  ```

#### Policy 2: Authenticated Upload
- **Name:** `Authenticated users can upload`
- **Policy Command:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
  ```sql
  true
  ```

#### Policy 3: Users Update Own
- **Name:** `Users can update own avatars`
- **Policy Command:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  (storage.foldername(name))[1] = auth.uid()::text
  ```

---

### Step 3: Fix `posts` Bucket

1. Click on **posts** bucket
2. Click **Policies** tab
3. Delete ALL existing policies
4. Create these 2 new policies:

#### Policy 1: Public Read
- **Name:** `Public can view posts`
- **Policy Command:** `SELECT`
- **Target roles:** `public`
- **USING expression:**
  ```sql
  true
  ```

#### Policy 2: Authenticated Upload
- **Name:** `Authenticated users can upload`
- **Policy Command:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
  ```sql
  true
  ```

---

### Step 4: Make Buckets Public

For BOTH `avatars` and `posts` buckets:

1. Click the bucket name
2. Click **Configuration** (or Settings)
3. Find **Public bucket** toggle
4. **Turn it ON** ✅
5. Click **Save**

---

## 🧪 Test After Fixing

1. Refresh your Mystify app
2. The 406 errors should be gone
3. Images should load correctly
4. Try uploading an avatar - should work now!

---

## 📝 Quick Checklist

- [ ] `avatars` bucket has 3 policies (Read, Insert, Update)
- [ ] `avatars` bucket is marked as **Public**
- [ ] `posts` bucket has 2 policies (Read, Insert)
- [ ] `posts` bucket is marked as **Public**
- [ ] Refreshed the app
- [ ] 406 errors are gone

---

## ⚠️ If Still Not Working

Run this SQL in Supabase SQL Editor:

```sql
-- Check if buckets are public
SELECT name, public FROM storage.buckets;

-- Should show:
-- avatars | true
-- posts   | true
```

If they show `false`, run:

```sql
UPDATE storage.buckets SET public = true WHERE name = 'avatars';
UPDATE storage.buckets SET public = true WHERE name = 'posts';
```
