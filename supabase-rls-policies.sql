-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to view profiles in their organization
CREATE POLICY "Users can view profiles in their organization" ON profiles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can insert profiles (for creating clients/agents)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Service role can update profiles (for upserting)
CREATE POLICY "Service role can update profiles" ON profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CLIENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view clients in their organization" ON clients;
DROP POLICY IF EXISTS "Service role can insert clients" ON clients;
DROP POLICY IF EXISTS "Service role can update clients" ON clients;

-- Allow users to view clients in their organization
CREATE POLICY "Users can view clients in their organization" ON clients
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can insert clients
CREATE POLICY "Service role can insert clients" ON clients
  FOR INSERT
  WITH CHECK (true);

-- Service role can update clients
CREATE POLICY "Service role can update clients" ON clients
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Allow users to view their organization
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- NOTES:
-- ============================================
-- These policies allow:
-- 1. Users to view their own profile and others in their org
-- 2. Service role (admin operations) to insert/update anything
-- 3. Users to view clients and organizations they belong to
--
-- The service role bypasses RLS by default, but explicit policies
-- ensure compatibility with all Supabase configurations.
-- ============================================
