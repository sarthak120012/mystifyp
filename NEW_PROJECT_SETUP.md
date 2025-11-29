# 🚀 New Supabase Project Setup Guide

Since you switched to a new project, you need to set it up from scratch.

## Step 1: Run the Database Setup Script
1. Go to your **New Supabase Project**.
2. Click **SQL Editor** in the left sidebar.
3. Open the file `supabase/FRESH_START.sql` from your project folder.
4. **Copy ALL the code** and paste it into the SQL Editor.
5. Click **Run** ▶️.

✅ This sets up all tables, permissions, and real-time features.

---

## Step 2: Set Up Storage Buckets (CRITICAL)
You must create these 4 buckets manually.

### 1. Create `avatars` Bucket
- Go to **Storage** → **New Bucket**
- Name: `avatars`
- **Public bucket:** ON ✅
- Click **Save**
- **Add Policy:**
  - Click **Configuration** → **Policies** → **New Policy**
  - Select **"For full customization"**
  - Name: `Public Access`
  - Allowed operations: **SELECT, INSERT, UPDATE**
  - Target roles: **Select ALL (anon, authenticated)**
  - Click **Review** → **Save**

### 2. Create `posts` Bucket
- Go to **Storage** → **New Bucket**
- Name: `posts`
- **Public bucket:** ON ✅
- Click **Save**
- **Add Policy:**
  - Click **Configuration** → **Policies** → **New Policy**
  - Select **"For full customization"**
  - Name: `Public Access`
  - Allowed operations: **SELECT, INSERT**
  - Target roles: **Select ALL (anon, authenticated)**
  - Click **Review** → **Save**

### 3. Create `vault-photos` Bucket
- Go to **Storage** → **New Bucket**
- Name: `vault-photos`
- **Public bucket:** OFF ❌ (Private)
- Click **Save**
- **Add Policy:**
  - Name: `Auth Access`
  - Allowed operations: **SELECT, INSERT, DELETE**
  - Target roles: **authenticated**
  - Click **Review** → **Save**

### 4. Create `vault-voice` Bucket
- Same as `vault-photos` (Private, Auth Access only)

---

## Step 3: Restart Your App
1. Stop the terminal (Ctrl+C).
2. Run `npm run dev` again.
3. **Sign Up** as a new user (since it's a new database).

🎉 **Everything should work perfectly now!**
