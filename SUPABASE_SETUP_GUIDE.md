# Supabase Setup Guide for Lead Gen OS

## Where Leads Are Stored

Leads are stored in the `leads` table in your Supabase database. Here's what the system expects:

## Required Tables & Columns

### 1. `leads` Table (Main Storage)

This is where ALL lead data lives. Required columns:

```sql
-- Core identification
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
organization_id UUID NOT NULL REFERENCES organizations(id)
campaign_id UUID NOT NULL REFERENCES campaigns(id)
client_id UUID REFERENCES clients(id)

-- Lead assignment (CRITICAL for new features!)
assigned_agent_id UUID REFERENCES profiles(id)  -- Which agent owns this lead

-- Contact information
first_name TEXT NOT NULL
last_name TEXT NOT NULL
email TEXT
phone TEXT NOT NULL
company TEXT
job_title TEXT

-- Lead status & scoring
status TEXT DEFAULT 'new'  -- new, contacted, interested, qualified, not_interested, converted, lost
priority INTEGER DEFAULT 0  -- 0-100 priority score
score INTEGER DEFAULT 0  -- 0-100 lead quality score

-- Tracking fields
source TEXT  -- csv_import, manual, api, etc.
last_contacted_at TIMESTAMP WITH TIME ZONE
next_follow_up_at TIMESTAMP WITH TIME ZONE
tags TEXT[]  -- Array of tags
custom_fields JSONB  -- Any additional custom data

-- Timestamps
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 2. `activities` Table (Activity Logging)

Logs ALL actions on leads (calls, notes, assignments):

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
organization_id UUID NOT NULL REFERENCES organizations(id)
lead_id UUID NOT NULL REFERENCES leads(id)
user_id UUID NOT NULL REFERENCES profiles(id)  -- Who did the action

type TEXT NOT NULL  -- 'call', 'note', 'email', 'meeting', 'assignment'
content TEXT  -- Description of what happened
metadata JSONB  -- Additional data (outcome, agent_id, etc.)

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**For the new assignment feature, the system logs:**
```json
{
  "type": "assignment",
  "content": "Lead assigned to John Doe",
  "metadata": {
    "agent_id": "uuid-of-agent",
    "assigned_by": "uuid-of-manager",
    "distribution_type": "manual" // or "auto"
  }
}
```

### 3. `calls` Table (Call History)

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
organization_id UUID NOT NULL
lead_id UUID NOT NULL REFERENCES leads(id)
agent_id UUID NOT NULL REFERENCES profiles(id)
campaign_id UUID REFERENCES campaigns(id)

phone_number TEXT
direction TEXT  -- 'inbound' or 'outbound'
status TEXT  -- 'completed', 'missed', 'failed'
outcome TEXT  -- 'no_answer', 'interested', 'qualified', etc. (11 outcomes)
duration_seconds INTEGER DEFAULT 0
notes TEXT

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 4. `campaigns` Table

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
organization_id UUID NOT NULL REFERENCES organizations(id)
client_id UUID NOT NULL REFERENCES clients(id)
created_by UUID REFERENCES profiles(id)

name TEXT NOT NULL
description TEXT
status TEXT DEFAULT 'draft'  -- draft, active, paused, completed
target_leads INTEGER
budget NUMERIC(10, 2)
start_date DATE
end_date DATE

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 5. `profiles` Table (Users)

```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
organization_id UUID NOT NULL REFERENCES organizations(id)

email TEXT NOT NULL
first_name TEXT
last_name TEXT
full_name TEXT  -- Computed: first_name || ' ' || last_name
role TEXT NOT NULL  -- 'owner', 'manager', 'agent', 'client'
is_active BOOLEAN DEFAULT true

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## How the System Works

### Lead Assignment Flow

1. **Import Leads** → Leads created with `assigned_agent_id = null` (unassigned)
2. **Batch Assignment** → Manager selects agent, picks count (e.g., 50 leads)
3. **System assigns oldest 50 unassigned leads** → Updates `assigned_agent_id`
4. **Activity logged** → Records who assigned, to whom, when
5. **Agent sees leads** → Agent dashboard filters `WHERE assigned_agent_id = agent_id`

### Auto-Distribution Flow

1. Manager clicks "Auto-Distribute All"
2. System gets all active agents
3. Gets all unassigned leads (prioritized by priority score, then age)
4. Round-robin assigns: Lead 1 → Agent A, Lead 2 → Agent B, Lead 3 → Agent C, Lead 4 → Agent A, etc.
5. All assignments logged in activities

### Reassignment Flow

1. Manager selects lead(s) in table
2. Chooses new agent
3. System updates `assigned_agent_id`
4. Logs activity with `previous_agent_id` and `new_agent_id` in metadata

## SQL Setup Script

Run this in Supabase SQL Editor to ensure everything is set up:

```sql
-- ============================================
-- ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================

-- Add missing columns to leads table (if they don't exist)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_leads_organization ON leads(organization_id);

-- Activities table indexes
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_organization ON activities(organization_id);

-- Calls table indexes
CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_campaign ON calls(campaign_id);

-- ============================================
-- DISABLE RLS (for now)
-- ============================================

-- We have RLS disabled for development
-- You can add proper policies later
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFY DATA
-- ============================================

-- Check if leads table is set up correctly
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Check existing leads
SELECT COUNT(*) as total_leads,
       COUNT(assigned_agent_id) as assigned,
       COUNT(*) - COUNT(assigned_agent_id) as unassigned
FROM leads;

-- Check campaigns with lead counts
SELECT
  c.id,
  c.name,
  c.status,
  COUNT(l.id) as total_leads,
  COUNT(l.assigned_agent_id) as assigned_leads,
  COUNT(l.id) - COUNT(l.assigned_agent_id) as unassigned_leads
FROM campaigns c
LEFT JOIN leads l ON c.id = l.campaign_id
GROUP BY c.id, c.name, c.status;
```

## Testing Checklist

After running the SQL above, verify:

- [ ] Can view campaigns list at `/dashboard/management/campaigns`
- [ ] Can click "View Campaign Details" on a campaign
- [ ] Campaign detail page shows:
  - [ ] Total leads count
  - [ ] Unassigned count
  - [ ] Contact rate
  - [ ] Batch assignment tool
- [ ] Can select agent and assign leads
- [ ] Can see assigned leads in agent's dashboard at `/dashboard/agent`
- [ ] Can filter leads by agent in campaign detail page
- [ ] Can search leads by name/phone/email
- [ ] Can click eye icon to view lead details
- [ ] Can reassign individual leads in modal
- [ ] Can select multiple leads and bulk reassign

## Data Flow Summary

```
CSV Import → leads table (assigned_agent_id = null)
                ↓
Management Dashboard → View Campaign → See all leads
                ↓
Batch Assign → Update leads SET assigned_agent_id = 'agent-uuid'
                ↓
Agent Dashboard → Show leads WHERE assigned_agent_id = current_agent_id
                ↓
Agent Makes Call → Insert into calls + activities tables
                ↓
Update Lead → leads.status, leads.score, leads.last_contacted_at
                ↓
Management Views → See updated status in campaign detail page
```

## Common Issues

**Q: Leads not showing in agent dashboard?**
- Check `assigned_agent_id` is set on leads
- Verify agent's ID matches `assigned_agent_id`
- Check RLS is disabled or policies allow access

**Q: Can't assign leads?**
- Verify user role is 'owner' or 'manager'
- Check `profiles` table has agents with role='agent'
- Ensure campaign has unassigned leads

**Q: Assignment not logging in activities?**
- Check activities table exists
- Verify activities table has `type` column
- Check RLS is disabled on activities

**Q: Lead counts not updating?**
- Hard refresh page (Cmd/Ctrl + Shift + R)
- Check browser console for errors
- Verify `router.refresh()` is being called after actions
