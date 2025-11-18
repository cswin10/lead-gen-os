# Supabase Schema Requirements for CRM System

This document outlines what needs to be added or updated in your Supabase database for the complete CRM system to work.

## ✅ Tables That Already Exist

Based on the schema you provided, these tables already exist:
- `organizations`
- `profiles`
- `clients`
- `campaigns`
- `leads`
- `calls`
- `activities`
- `daily_metrics`

## 🔧 Required Updates to Existing Tables

### 1. `leads` Table
Make sure the following columns exist (most should already be there):

```sql
-- Check if these columns exist in your leads table:
-- If any are missing, add them:

ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
```

### 2. `calls` Table
Verify these columns exist:

```sql
-- These should already exist based on your schema
-- phone_number TEXT
-- direction TEXT (with CHECK constraint)
-- status (call_status enum)
-- outcome (call_outcome enum or TEXT)
-- duration_seconds INTEGER
-- notes TEXT
```

### 3. `activities` Table
Verify the structure:

```sql
-- Should have:
-- id UUID PRIMARY KEY
-- organization_id UUID
-- lead_id UUID
-- user_id UUID (references profiles)
-- type TEXT (or ENUM: 'call', 'note', 'email', 'meeting')
-- content TEXT
-- metadata JSONB
-- created_at TIMESTAMP
```

## 📋 Enum Types to Create/Verify

Check if these enum types exist. If not, create them:

```sql
-- Lead status values needed:
-- new, contacted, qualified, interested, not_interested, converted, lost

-- Call outcome values needed:
CREATE TYPE call_outcome AS ENUM (
  'no_answer',
  'wrong_number',
  'gatekeeper',
  'busy',
  'voicemail',
  'connected',
  'interested',
  'qualified',
  'not_interested',
  'callback',
  'appointment_set'
);

-- If call_outcome already exists as text, that's fine too
-- The system will work with TEXT type as well
```

## 🔍 Verify These Queries Work

Run these test queries to make sure your schema is compatible:

```sql
-- Test 1: Can fetch leads with campaigns and clients
SELECT
  leads.*,
  campaigns.name as campaign_name,
  clients.company_name
FROM leads
LEFT JOIN campaigns ON leads.campaign_id = campaigns.id
LEFT JOIN clients ON leads.client_id = clients.id
WHERE assigned_agent_id = 'some-agent-id'
LIMIT 1;

-- Test 2: Can insert activities
INSERT INTO activities (
  organization_id,
  lead_id,
  user_id,
  type,
  content,
  metadata
) VALUES (
  'test-org-id',
  'test-lead-id',
  'test-user-id',
  'note',
  'Test note',
  '{"test": true}'::jsonb
);

-- Test 3: Can fetch activities with profiles
SELECT
  activities.*,
  profiles.first_name,
  profiles.last_name
FROM activities
LEFT JOIN profiles ON activities.user_id = profiles.id
WHERE lead_id = 'some-lead-id'
ORDER BY created_at DESC
LIMIT 10;

-- Test 4: Can update lead with score and callback date
UPDATE leads
SET
  score = 70,
  status = 'interested',
  next_follow_up_at = NOW() + INTERVAL '1 day',
  last_contacted_at = NOW(),
  updated_at = NOW()
WHERE id = 'some-lead-id';

-- Test 5: Can insert calls with outcome
INSERT INTO calls (
  lead_id,
  agent_id,
  organization_id,
  phone_number,
  direction,
  status,
  outcome,
  duration_seconds,
  notes
) VALUES (
  'test-lead-id',
  'test-agent-id',
  'test-org-id',
  '+1234567890',
  'outbound',
  'completed',
  'interested',
  120,
  'Lead was very interested'
);
```

## ⚠️ Important Notes

1. **RLS Policies**: Make sure Row Level Security is DISABLED or properly configured for:
   - `leads` - agents need to read/update their assigned leads
   - `calls` - agents need to insert call records
   - `activities` - agents need to insert and read activities
   - If RLS is enabled, agents won't be able to log calls or add notes

2. **Foreign Key Constraints**: Verify these relationships exist:
   - `leads.assigned_agent_id` → `profiles.id`
   - `leads.campaign_id` → `campaigns.id`
   - `leads.client_id` → `clients.id`
   - `calls.lead_id` → `leads.id`
   - `calls.agent_id` → `profiles.id`
   - `activities.lead_id` → `leads.id`
   - `activities.user_id` → `profiles.id`

3. **Indexes for Performance**: Consider adding these indexes:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent_id);
   CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
   CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_at);
   CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
   CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
   CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
   ```

## 🚀 Quick Setup SQL Script

Run this to add any missing columns and verify the schema:

```sql
-- Add missing columns if needed
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);

-- Verify RLS is disabled (or configure proper policies)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
```

## ✅ Testing Checklist

After running the setup:
1. [ ] Can view leads in agent dashboard
2. [ ] Can make a "call" and select an outcome
3. [ ] Can see call logged in activities
4. [ ] Can schedule a callback and see it in "Callbacks" tab
5. [ ] Can add a note to a lead
6. [ ] Can see activity timeline on lead detail panel
7. [ ] Lead score updates when marked as interested/qualified
8. [ ] Lead appears in correct category after outcome (New Today, Callbacks, etc.)

## 📊 Sample Data for Testing

Want to test the system? Here's a script to create sample leads:

```sql
-- Insert a test lead for your agent
INSERT INTO leads (
  organization_id,
  campaign_id,
  assigned_agent_id,
  first_name,
  last_name,
  email,
  phone,
  company,
  job_title,
  status,
  priority,
  score,
  source
) VALUES (
  'your-org-id-here',
  'your-campaign-id-here',
  'your-agent-id-here',
  'John',
  'Doe',
  'john@example.com',
  '+1234567890',
  'Example Corp',
  'CEO',
  'new',
  50,
  30,
  'manual'
);
```

---

Need help with any of these steps? Check the Supabase SQL Editor and run the verification queries above!
