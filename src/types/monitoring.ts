export interface MonitoredClan {
  clan_id: number;
  tag: string;
  name: string;
  enabled: boolean;
  added_at: string;
  last_checked?: string;
  last_member_count?: number;
  status: 'active' | 'error' | 'never_checked';
  error_message?: string;
  last_members?: Array<{
    account_id: number;
    account_name: string;
    role: string;
  }>;
}

export interface MonitoringConfig {
  discord_webhook_url?: string;
  check_interval: 'hourly' | 'daily';
  notification_types: {
    player_left: boolean;
    player_joined: boolean;
    role_changes: boolean;
  };
  last_global_check?: string;
}

export interface PlayerExclusionAlert {
  id: string;
  clan_id: number;
  clan_tag: string;
  clan_name: string;
  player_id: number;
  player_name: string;
  excluded_at: string;
  previous_role: string;
  notification_sent: boolean;
}