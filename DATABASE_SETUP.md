# ⚠️ CRITICAL: Database Setup - CORRECT ORDER!

## 🔴 **IMPORTANT: You got an error because you ran the files in the WRONG ORDER!**

You tried to run `rls-policies.sql` FIRST, but the tables don't exist yet!

---

## ✅ **CORRECT SETUP STEPS:**

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/rtuwmosbodkgibickflf/sql

---

### Step 2: Run schema.sql FIRST ⭐
1. Open file: `mystifyapp/supabase/schema.sql`
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"RUN"** button (bottom right)
5. Wait for **"Success"** message
6. ✅ This creates all 16 tables

---

### Step 3: Run rls-policies.sql SECOND
1. Open file: `mystifyapp/supabase/rls-policies.sql`
2. Copy **ALL** the content
3. Paste into Supabase SQL Editor
4. Click **"RUN"**
5. Wait for **"Success"**
6. ✅ This adds security policies

---

### Step 4: Run storage-buckets.sql THIRD
1. Open file: `mystifyapp/supabase/storage-buckets.sql`
2. Copy **ALL** the content
3. Paste into Supabase SQL Editor
4. Click **"RUN"**
5. Wait for **"Success"**
6. ✅ This creates storage buckets

---

## ✅ Verify Setup

### Check Tables (should see 16):
Go to: https://supabase.com/dashboard/project/rtuwmosbodkgibickflf/editor

You should see:
- ✅ profiles
- ✅ follows
- ✅ blocks
- ✅ reports
- ✅ posts
- ✅ likes
- ✅ comments
- ✅ messages
- ✅ typing_indicators
- ✅ online_status
- ✅ game_rooms
- ✅ game_moves
- ✅ leaderboard
- ✅ notifications
- ✅ vault_items
- ✅ vault_pins

### Check Storage Buckets (should see 3):
Go to: https://supabase.com/dashboard/project/rtuwmosbodkgibickflf/storage/buckets

You should see:
- ✅ posts
- ✅ avatars
- ✅ private_vault

---

## 🎉 After Successful Setup

1. **Refresh your browser** (Ctrl+R or Cmd+R)
2. Go to http://localhost:5173
3. Try signing up - avatars will load!
4. Everything will work!

---

## 🚨 If You Still Get Errors

**Error: "relation already exists"**
- This is OK! It means some tables were created
- Continue to next file

**Error: "syntax error"**
- Make sure you copied the ENTIRE file
- Check you didn't miss the beginning or end

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase project
- URL should be: rtuwmosbodkgibickflf

---

## 💡 Quick Checklist

- [ ] Run schema.sql FIRST
- [ ] Run rls-policies.sql SECOND  
- [ ] Run storage-buckets.sql THIRD
- [ ] Verify 16 tables exist
- [ ] Verify 3 storage buckets exist
- [ ] Refresh browser
- [ ] Test signup with avatars

**Once this is done, tell me and I'll implement all the other features you requested!**
