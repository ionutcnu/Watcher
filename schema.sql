-- Clan Snapshots Table
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  name TEXT NOT NULL,
  members TEXT NOT NULL, -- JSON array of members
  snapshot_date TEXT NOT NULL, -- ISO date string
  timestamp INTEGER NOT NULL, -- Unix timestamp in milliseconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup of latest snapshot by clan
CREATE INDEX IF NOT EXISTS idx_snapshots_clan_timestamp ON snapshots(clan_id, timestamp DESC);

-- Clan Changes Table
CREATE TABLE IF NOT EXISTS changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'join' or 'leave'
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  clan_id INTEGER NOT NULL,
  clan_tag TEXT NOT NULL,
  clan_name TEXT NOT NULL,
  timestamp INTEGER NOT NULL, -- Unix timestamp in milliseconds
  date TEXT NOT NULL, -- ISO date string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_changes_date ON changes(date DESC);
CREATE INDEX IF NOT EXISTS idx_changes_clan ON changes(clan_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_changes_player ON changes(player_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp DESC);

-- Monitored Clans Table
CREATE TABLE IF NOT EXISTS monitored_clans (
  clan_id INTEGER PRIMARY KEY,
  tag TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1, -- SQLite uses 1/0 for boolean
  added_at TEXT NOT NULL, -- ISO date string
  last_checked TEXT, -- ISO date string
  last_member_count INTEGER,
  status TEXT NOT NULL DEFAULT 'never_checked', -- 'active', 'error', 'never_checked'
  error_message TEXT,
  last_members TEXT, -- JSON array of members
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for enabled clans
CREATE INDEX IF NOT EXISTS idx_monitored_clans_enabled ON monitored_clans(enabled, last_checked);

-- Monitoring Configuration Table (single row config)
CREATE TABLE IF NOT EXISTS monitoring_config (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one config row
  discord_webhook_url TEXT,
  check_interval TEXT NOT NULL DEFAULT 'daily', -- 'hourly' or 'daily'
  notification_player_left INTEGER NOT NULL DEFAULT 1,
  notification_player_joined INTEGER NOT NULL DEFAULT 0,
  notification_role_changes INTEGER NOT NULL DEFAULT 0,
  last_global_check TEXT, -- ISO date string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config if not exists
INSERT OR IGNORE INTO monitoring_config (id, check_interval, notification_player_left, notification_player_joined, notification_role_changes)
VALUES (1, 'daily', 1, 0, 0);

-- Player Exclusion Alerts Table
CREATE TABLE IF NOT EXISTS exclusion_alerts (
  id TEXT PRIMARY KEY,
  clan_id INTEGER NOT NULL,
  clan_tag TEXT NOT NULL,
  clan_name TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  excluded_at TEXT NOT NULL, -- ISO date string
  previous_role TEXT,
  notification_sent INTEGER NOT NULL DEFAULT 0, -- SQLite boolean
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for exclusion alerts
CREATE INDEX IF NOT EXISTS idx_exclusion_alerts_clan ON exclusion_alerts(clan_id, excluded_at DESC);
CREATE INDEX IF NOT EXISTS idx_exclusion_alerts_player ON exclusion_alerts(player_id, excluded_at DESC);
CREATE INDEX IF NOT EXISTS idx_exclusion_alerts_notification ON exclusion_alerts(notification_sent, excluded_at DESC);
