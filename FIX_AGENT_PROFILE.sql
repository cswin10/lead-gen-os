-- Fix agent profile to have full_name
-- This will update all profiles to have full_name computed from first_name and last_name

-- First, check what agents you have
SELECT id, email, first_name, last_name, full_name, role
FROM profiles
WHERE role = 'agent';

-- Update full_name for all agents that don't have it
UPDATE profiles
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE role = 'agent'
  AND (full_name IS NULL OR full_name = '');

-- If first_name and last_name are also empty, use email
UPDATE profiles
SET full_name = email
WHERE role = 'agent'
  AND (full_name IS NULL OR full_name = '' OR full_name = ' ');

-- Verify the fix
SELECT id, email, first_name, last_name, full_name, role
FROM profiles
WHERE role = 'agent';

-- Optional: Create a trigger to auto-populate full_name in the future
CREATE OR REPLACE FUNCTION update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
  ELSIF NEW.first_name IS NOT NULL THEN
    NEW.full_name := NEW.first_name;
  ELSIF NEW.email IS NOT NULL THEN
    NEW.full_name := NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_full_name ON profiles;

-- Create trigger
CREATE TRIGGER trigger_update_full_name
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_full_name();
