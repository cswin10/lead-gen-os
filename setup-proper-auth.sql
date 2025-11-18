-- ============================================
-- CLEANUP AND PROPER SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop the auto-profile trigger (we don't want automatic profile creation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Make sure RLS is DISABLED (we'll add proper policies later)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NEXT STEPS (Do these in Supabase Dashboard):
-- ============================================
-- 1. Go to Authentication → Settings → Auth Providers
-- 2. Scroll to "Email Auth"
-- 3. DISABLE "Enable email confirmations"
-- 4. DISABLE "Enable sign ups" (THIS IS CRITICAL)
--
-- This will prevent users from creating their own accounts.
-- Only you (via the dashboard) or owners (via the admin actions) can create users.
-- ============================================
