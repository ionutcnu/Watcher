import { ClanSnapshot, ClanChange } from '@/types/clan';

// D1 database interface (passed from Cloudflare Workers environment)
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    last_row_id?: number;
    changes?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export async function saveSnapshot(db: D1Database, snapshot: ClanSnapshot): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO snapshots (clan_id, tag, name, members, snapshot_date, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    snapshot.clan_id,
    snapshot.tag,
    snapshot.name,
    JSON.stringify(snapshot.members),
    snapshot.snapshot_date,
    snapshot.timestamp
  );

  await stmt.run();
}

export async function getLatestSnapshot(db: D1Database, clanId: number): Promise<ClanSnapshot | null> {
  const stmt = db.prepare(
    `SELECT clan_id, tag, name, members, snapshot_date, timestamp
     FROM snapshots
     WHERE clan_id = ?
     ORDER BY timestamp DESC
     LIMIT 1`
  ).bind(clanId);

  const result = await stmt.first<{
    clan_id: number;
    tag: string;
    name: string;
    members: string;
    snapshot_date: string;
    timestamp: number;
  }>();

  if (!result) {
    return null;
  }

  return {
    clan_id: result.clan_id,
    tag: result.tag,
    name: result.name,
    members: JSON.parse(result.members),
    snapshot_date: result.snapshot_date,
    timestamp: result.timestamp
  };
}

export async function saveChanges(db: D1Database, changes: ClanChange[]): Promise<void> {
  if (changes.length === 0) return;

  const statements = changes.map(change =>
    db.prepare(
      `INSERT INTO changes (type, player_id, player_name, clan_id, clan_tag, clan_name, timestamp, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      change.type,
      change.player.account_id,
      change.player.account_name,
      change.clan.clan_id,
      change.clan.tag,
      change.clan.name,
      change.timestamp,
      change.date
    )
  );

  await db.batch(statements);
}

export async function getRecentChanges(db: D1Database, days: number = 7): Promise<ClanChange[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffTimestamp = cutoffDate.getTime();

  const stmt = db.prepare(
    `SELECT type, player_id, player_name, clan_id, clan_tag, clan_name, timestamp, date
     FROM changes
     WHERE timestamp >= ?
     ORDER BY timestamp DESC`
  ).bind(cutoffTimestamp);

  const result = await stmt.all<{
    type: 'join' | 'leave';
    player_id: number;
    player_name: string;
    clan_id: number;
    clan_tag: string;
    clan_name: string;
    timestamp: number;
    date: string;
  }>();

  if (!result.results) {
    return [];
  }

  return result.results.map(row => ({
    type: row.type,
    player: {
      account_id: row.player_id,
      account_name: row.player_name
    },
    clan: {
      clan_id: row.clan_id,
      tag: row.clan_tag,
      name: row.clan_name
    },
    timestamp: row.timestamp,
    date: row.date
  }));
}
