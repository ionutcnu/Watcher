import { MonitoredClan, MonitoringConfig, PlayerExclusionAlert } from '@/types/monitoring';
import { D1Database } from './storage';

// Monitored Clans Management
export async function getMonitoredClans(db: D1Database): Promise<MonitoredClan[]> {
  const stmt = db.prepare(`
    SELECT
      clan_id, tag, name, enabled, added_at, last_checked,
      last_member_count, status, error_message, last_members
    FROM monitored_clans
    ORDER BY added_at DESC
  `);

  const result = await stmt.all<{
    clan_id: number;
    tag: string;
    name: string;
    enabled: number;
    added_at: string;
    last_checked: string | null;
    last_member_count: number | null;
    status: 'active' | 'error' | 'never_checked';
    error_message: string | null;
    last_members: string | null;
  }>();

  if (!result.results) {
    return [];
  }

  return result.results.map(row => ({
    clan_id: row.clan_id,
    tag: row.tag,
    name: row.name,
    enabled: Boolean(row.enabled),
    added_at: row.added_at,
    last_checked: row.last_checked ?? undefined,
    last_member_count: row.last_member_count ?? undefined,
    status: row.status,
    error_message: row.error_message ?? undefined,
    last_members: row.last_members ? JSON.parse(row.last_members) : undefined
  }));
}

export async function addMonitoredClan(
  db: D1Database,
  clan: Omit<MonitoredClan, 'added_at' | 'status'>
): Promise<void> {
  // Check if clan already exists
  const existing = await db.prepare(
    'SELECT clan_id FROM monitored_clans WHERE clan_id = ?'
  ).bind(clan.clan_id).first();

  if (existing) {
    throw new Error(`Clan ${clan.tag} is already being monitored`);
  }

  const stmt = db.prepare(`
    INSERT INTO monitored_clans (
      clan_id, tag, name, enabled, added_at, status,
      last_checked, last_member_count, error_message, last_members
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    clan.clan_id,
    clan.tag,
    clan.name,
    clan.enabled ? 1 : 0,
    new Date().toISOString(),
    'never_checked',
    clan.last_checked || null,
    clan.last_member_count || null,
    clan.error_message || null,
    clan.last_members ? JSON.stringify(clan.last_members) : null
  );

  await stmt.run();
}

export async function removeMonitoredClan(db: D1Database, clanId: number): Promise<void> {
  const stmt = db.prepare('DELETE FROM monitored_clans WHERE clan_id = ?').bind(clanId);
  await stmt.run();
}

export async function updateClanStatus(
  db: D1Database,
  clanId: number,
  updates: Partial<MonitoredClan>
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(updates.enabled ? 1 : 0);
  }
  if (updates.last_checked !== undefined) {
    fields.push('last_checked = ?');
    values.push(updates.last_checked);
  }
  if (updates.last_member_count !== undefined) {
    fields.push('last_member_count = ?');
    values.push(updates.last_member_count);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.error_message !== undefined) {
    fields.push('error_message = ?');
    values.push(updates.error_message);
  }
  if (updates.last_members !== undefined) {
    fields.push('last_members = ?');
    values.push(JSON.stringify(updates.last_members));
  }

  if (fields.length === 0) {
    return;
  }

  const stmt = db.prepare(
    `UPDATE monitored_clans SET ${fields.join(', ')} WHERE clan_id = ?`
  ).bind(...values, clanId);

  await stmt.run();
}

// Monitoring Configuration
export async function getMonitoringConfig(db: D1Database): Promise<MonitoringConfig> {
  const stmt = db.prepare(`
    SELECT
      discord_webhook_url, check_interval,
      notification_player_left, notification_player_joined, notification_role_changes,
      last_global_check
    FROM monitoring_config
    WHERE id = 1
  `);

  const result = await stmt.first<{
    discord_webhook_url: string | null;
    check_interval: 'hourly' | 'daily';
    notification_player_left: number;
    notification_player_joined: number;
    notification_role_changes: number;
    last_global_check: string | null;
  }>();

  if (!result) {
    // Return default config if not found
    return {
      check_interval: 'daily',
      notification_types: {
        player_left: true,
        player_joined: false,
        role_changes: false
      }
    };
  }

  return {
    discord_webhook_url: result.discord_webhook_url ?? undefined,
    check_interval: result.check_interval,
    notification_types: {
      player_left: Boolean(result.notification_player_left),
      player_joined: Boolean(result.notification_player_joined),
      role_changes: Boolean(result.notification_role_changes)
    },
    last_global_check: result.last_global_check ?? undefined
  };
}

export async function saveMonitoringConfig(db: D1Database, config: MonitoringConfig): Promise<void> {
  const stmt = db.prepare(`
    UPDATE monitoring_config
    SET
      discord_webhook_url = ?,
      check_interval = ?,
      notification_player_left = ?,
      notification_player_joined = ?,
      notification_role_changes = ?,
      last_global_check = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).bind(
    config.discord_webhook_url || null,
    config.check_interval,
    config.notification_types.player_left ? 1 : 0,
    config.notification_types.player_joined ? 1 : 0,
    config.notification_types.role_changes ? 1 : 0,
    config.last_global_check || null
  );

  await stmt.run();
}

// Exclusion Alerts
export async function getExclusionAlerts(db: D1Database, limit: number = 1000): Promise<PlayerExclusionAlert[]> {
  const stmt = db.prepare(`
    SELECT
      id, clan_id, clan_tag, clan_name, player_id, player_name,
      excluded_at, previous_role, notification_sent
    FROM exclusion_alerts
    ORDER BY excluded_at DESC
    LIMIT ?
  `).bind(limit);

  const result = await stmt.all<{
    id: string;
    clan_id: number;
    clan_tag: string;
    clan_name: string;
    player_id: number;
    player_name: string;
    excluded_at: string;
    previous_role: string | null;
    notification_sent: number;
  }>();

  if (!result.results) {
    return [];
  }

  return result.results.map(row => ({
    id: row.id,
    clan_id: row.clan_id,
    clan_tag: row.clan_tag,
    clan_name: row.clan_name,
    player_id: row.player_id,
    player_name: row.player_name,
    excluded_at: row.excluded_at,
    previous_role: row.previous_role || '',
    notification_sent: Boolean(row.notification_sent)
  }));
}

export async function saveExclusionAlert(db: D1Database, alert: PlayerExclusionAlert): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO exclusion_alerts (
      id, clan_id, clan_tag, clan_name, player_id, player_name,
      excluded_at, previous_role, notification_sent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    alert.id,
    alert.clan_id,
    alert.clan_tag,
    alert.clan_name,
    alert.player_id,
    alert.player_name,
    alert.excluded_at,
    alert.previous_role || null,
    alert.notification_sent ? 1 : 0
  );

  await stmt.run();
}
