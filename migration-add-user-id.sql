-- Add user_id to monitored_clans table for multi-user support

-- Add user_id column (can be NULL for existing clans)
ALTER TABLE monitored_clans ADD COLUMN user_id TEXT REFERENCES user(id);

-- Create index for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_monitored_clans_user_id ON monitored_clans(user_id);

-- Note: Existing clans will have NULL user_id
-- They can be assigned to users later or kept as legacy/shared clans
