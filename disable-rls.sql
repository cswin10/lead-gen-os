-- Temporarily disable RLS to allow login
-- Run this in Supabase SQL Editor

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- This will allow you to log in again
-- We'll add proper RLS policies later once everything is working
