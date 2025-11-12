-- ============================================
-- AUTO-PROFILE CREATION TRIGGER
-- Run this in Supabase SQL Editor
-- ============================================

-- This trigger automatically creates a profile when a user signs up
-- It reads the user's metadata (full_name) from the signup form

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'agent',
    -- For the first user, create a new organization
    -- For subsequent users, they'll need their organization_id updated manually
    -- or through an invitation system
    (
      SELECT id FROM public.organizations 
      WHERE slug = LOWER(REPLACE(SPLIT_PART(new.email, '@', 1), '.', '-'))
      LIMIT 1
    )
  );
  
  -- If no organization exists, create one for them
  IF NOT FOUND THEN
    WITH new_org AS (
      INSERT INTO public.organizations (name, slug)
      VALUES (
        SPLIT_PART(new.email, '@', 1) || '''s Organization',
        LOWER(REPLACE(SPLIT_PART(new.email, '@', 1), '.', '-')) || '-' || SUBSTR(MD5(RANDOM()::text), 1, 6)
      )
      RETURNING id
    )
    UPDATE public.profiles
    SET organization_id = (SELECT id FROM new_org)
    WHERE id = new.id;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- NOTES:
-- ============================================
-- This trigger will:
-- 1. Create a profile for every new user
-- 2. Set their role to 'agent' by default
-- 3. Try to find an existing organization or create a new one
-- 4. Organization creation is basic - in production you'd want
--    proper invitation/onboarding flow
-- 
-- IMPORTANT: After running this, manually update user roles in
-- the profiles table to 'owner' or 'manager' as needed.
-- ============================================
