-- ============================================
-- SETUP CHARLIE'S OWNER ACCOUNT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the organization
INSERT INTO organizations (name, slug)
VALUES ('Charlie Swinhoe', 'charlie-swinhoe')
RETURNING id;

-- !! COPY THE ID FROM ABOVE !!

-- Step 2: Create the owner profile
-- First, you need to create the auth user manually:
-- 1. Go to Authentication → Users in Supabase Dashboard
-- 2. Click "Add user" → "Create new user"
-- 3. Email: crcswinhoe@gmail.com
-- 4. Password: (choose a secure password)
-- 5. Turn OFF "Auto Confirm User"
-- 6. Click "Create user"
-- 7. Copy the User ID (UUID)

-- Then run this SQL (replace the UUIDs):
INSERT INTO profiles (id, organization_id, email, first_name, last_name, role)
VALUES (
  'PASTE-AUTH-USER-ID-HERE',  -- The UUID from step 2
  'PASTE-ORGANIZATION-ID-HERE',  -- The UUID from step 1
  'crcswinhoe@gmail.com',
  'Charlie',
  'Swinhoe',
  'owner'
);

-- ============================================
-- After running this, you can:
-- 1. Log in with crcswinhoe@gmail.com
-- 2. Go to Settings → Add clients and agents
-- ============================================
