# Database Setup Instructions

## Step 1: Run the Schema
Copy the contents of `schema.sql` and run it in the Supabase SQL Editor:
1. Go to https://supabase.com/dashboard/project/rtuwmosbodkgibickflf/sql
2. Paste the contents of `schema.sql`
3. Click "Run"

## Step 2: Apply RLS Policies
Copy the contents of `rls-policies.sql` and run it in the Supabase SQL Editor:
1. Paste the contents of `rls-policies.sql`
2. Click "Run"

## Step 3: Configure Storage Buckets
Copy the contents of `storage-buckets.sql` and run it in the Supabase SQL Editor:
1. Paste the contents of `storage-buckets.sql`
2. Click "Run"

## Step 4: Verify Setup
After running all three SQL files, verify:
- All tables appear under "Table Editor"
- Storage buckets appear under "Storage"
- RLS is enabled on all tables

## Note
You only need to run these SQL files ONCE in your Supabase dashboard. The app will then be able to interact with the database.
