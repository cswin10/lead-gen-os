-- Add Twilio integration fields to calls table
-- Run this in your Supabase SQL Editor

-- Add twilio_call_sid column to track Twilio call IDs
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_twilio_call_sid
ON calls(twilio_call_sid);

-- Add direction column if it doesn't exist
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';

-- Add comment to document the column
COMMENT ON COLUMN calls.twilio_call_sid IS 'Twilio Call SID for tracking call status updates';
COMMENT ON COLUMN calls.direction IS 'Call direction: inbound or outbound';
