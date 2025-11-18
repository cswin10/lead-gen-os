# Debug Lead Import Issue

The import is failing silently. Let's find out why.

## Step 1: Check Browser Console

1. Open browser console (F12)
2. Go to import page
3. Try importing again
4. Look for errors - especially "Batch insert error" logs

## Step 2: Check Required Tables in Supabase

Run this SQL in Supabase SQL Editor:

```sql
-- Check if all required tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('leads', 'campaigns', 'organizations', 'profiles', 'activities')
ORDER BY table_name;
```

**Expected:** All 5 tables should be listed

## Step 3: Check if Organizations & Campaigns Exist

```sql
-- Check your organization
SELECT id, name FROM organizations;

-- Check your campaigns
SELECT id, name, organization_id FROM campaigns;
```

**You need:** At least 1 organization and 1 campaign

## Step 4: Test Manual Lead Insert

Try inserting a lead manually to see the exact error:

```sql
-- Replace these UUIDs with your actual IDs from Step 3
INSERT INTO leads (
  organization_id,
  campaign_id,
  first_name,
  last_name,
  phone,
  status,
  priority,
  score,
  source
) VALUES (
  'YOUR-ORG-ID-HERE',      -- From organizations table
  'YOUR-CAMPAIGN-ID-HERE',  -- From campaigns table
  'Test',
  'User',
  '+447700900000',
  'new',
  50,
  0,
  'manual'
);
```

**What to watch for:**
- Foreign key constraint errors → means organization_id or campaign_id is wrong
- Column doesn't exist errors → means we're missing required columns
- RLS policy errors → means we need to disable RLS

## Step 5: Common Issues & Fixes

### Issue A: Activities table insert failing

The import tries to log an activity but `activities` table might not have the right structure:

```sql
-- Check activities table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activities';
```

**Fix if missing:**
```sql
-- The activities insert in import.ts doesn't include lead_id, so it should work
-- But if activities table doesn't exist:
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
```

### Issue B: Missing required columns in leads table

```sql
-- Check leads table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
```

**Required columns:**
- organization_id (UUID, NOT NULL)
- campaign_id (UUID, NOT NULL)
- client_id (UUID, nullable)
- assigned_agent_id (UUID, nullable)
- first_name (TEXT, NOT NULL)
- last_name (TEXT, NOT NULL)
- email (TEXT, nullable)
- phone (TEXT, NOT NULL)
- company (TEXT, nullable)
- job_title (TEXT, nullable)
- status (TEXT)
- priority (INTEGER)
- score (INTEGER)
- source (TEXT)
- tags (TEXT[])
- custom_fields (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Issue C: RLS blocking inserts

```sql
-- Disable RLS on all tables
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

## Step 6: Get Your IDs for Testing

Run this to get the exact IDs to use in the import:

```sql
-- Get your organization ID
SELECT id, name FROM organizations WHERE name LIKE '%Swinhoe%' OR name LIKE '%Charlie%';

-- Get your campaign ID
SELECT c.id, c.name, o.name as org_name
FROM campaigns c
JOIN organizations o ON c.organization_id = o.id
LIMIT 5;

-- Get your user ID (the one you're logged in as)
SELECT id, email, full_name, role
FROM profiles
WHERE email = 'crcswinhoe@gmail.com';
```

## Step 7: Check Server Logs

After attempting import, check the deployment logs in Netlify:
1. Go to Netlify Dashboard
2. Click on your deployment
3. Click "Functions" tab
4. Look for any error logs

## Quick Fix: Create Test Lead Directly

Once you have your organization_id and campaign_id from Step 6:

```sql
-- Insert a test lead manually
INSERT INTO leads (
  organization_id,
  campaign_id,
  first_name,
  last_name,
  phone,
  email,
  company,
  job_title,
  status,
  priority,
  score,
  source,
  tags,
  custom_fields
) VALUES (
  'your-org-id',
  'your-campaign-id',
  'John',
  'Smith',
  '+447700900101',
  'john.smith@techcorp.com',
  'TechCorp Ltd',
  'IT Director',
  'new',
  85,
  0,
  'csv_import',
  ARRAY['enterprise', 'tech', 'hot'],
  '{}'::jsonb
);

-- Verify it was inserted
SELECT id, first_name, last_name, company, phone FROM leads;
```

If this manual insert works, then the problem is in the import code logic, not the database schema.

---

## What to Report Back

Tell me:
1. ✅/❌ Do all 5 tables exist? (Step 2)
2. ✅/❌ Do you have an organization and campaign? (Step 3)
3. ✅/❌ Did manual insert work? (Step 4)
4. What error message appeared (if any)?
5. Browser console errors during import?

Then I can fix the exact issue!
