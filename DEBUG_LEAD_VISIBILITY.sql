-- Check what's actually in the leads table
SELECT
  id,
  first_name,
  last_name,
  status,
  assigned_agent_id,
  created_at::date as created_date,
  NOW()::date as today,
  CASE
    WHEN created_at::date = NOW()::date THEN 'SHOWS IN NEW TODAY'
    ELSE 'HIDDEN - not created today'
  END as visibility
FROM leads
WHERE assigned_agent_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check the date discrepancy
SELECT
  status,
  created_at::date as created_date,
  COUNT(*) as count
FROM leads
WHERE assigned_agent_id IS NOT NULL
GROUP BY status, created_at::date
ORDER BY created_at::date DESC;
