import { NextRequest } from 'next/server';
import { getPlayerHistory } from '@/lib/storage';
import { withDB, withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

type HistoryEvent = {
  type: 'join' | 'leave';
  clan_tag: string;
  clan_name: string;
  timestamp: number;
  date: string;
  source: 'tomato' | 'wg' | 'db';
};

async function fetchTomatoGgHistory(accountId: number): Promise<HistoryEvent[]> {
  const res = await fetch(
    `https://api.tomato.gg/api/player/clan-history-unofficial/EU/${accountId}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) {
    console.error('[player-history] tomato.gg error:', res.status, res.statusText);
    throw new Error(`tomato.gg returned ${res.status}`);
  }
  const data = await res.json();
  if (data.meta?.status !== 'good' || !Array.isArray(data.data)) {
    console.error('[player-history] tomato.gg error: invalid response', data.meta);
    throw new Error('Invalid tomato.gg response');
  }

  const events: HistoryEvent[] = [];
  for (const entry of data.data) {
    const { clan, since, until } = entry;
    const tag = clan.tag ?? '?';
    const name = clan.name ?? '';
    const joinTs = Math.floor(new Date(since + 'Z').getTime() / 1000);
    events.push({ type: 'join', clan_tag: tag, clan_name: name, timestamp: joinTs, date: since.split('T')[0], source: 'tomato' });
    if (until) {
      const leaveTs = Math.floor(new Date(until + 'Z').getTime() / 1000);
      events.push({ type: 'leave', clan_tag: tag, clan_name: name, timestamp: leaveTs, date: until.split('T')[0], source: 'tomato' });
    }
  }
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const playerIdParam = url.searchParams.get('playerId');
    const playerId = parseInt(playerIdParam || '', 10);

    if (isNaN(playerId) || playerId <= 0) {
      return badRequest('Invalid playerId');
    }

    const wgResult = await withWargamingAPI();
    const api = 'api' in wgResult ? wgResult.api : undefined;

    // Fetch Tomato.gg history + WG current clan in parallel
    const [tomatoResult, currentClanResult] = await Promise.allSettled([
      fetchTomatoGgHistory(playerId),
      api ? api.getPlayerCurrentClan(playerId) : Promise.resolve(null),
    ]);

    const currentClan = currentClanResult.status === 'fulfilled' ? currentClanResult.value : null;

    // Tier 1: Tomato.gg
    if (tomatoResult.status === 'fulfilled' && tomatoResult.value.length > 0) {
      return ok({ history: tomatoResult.value, source: 'tomato', currentClan });
    }

    // Tier 2: WG memberhistory API
    if (api) {
      try {
        const wgHistory = await api.getPlayerClanHistory(playerId);
        if (wgHistory.length > 0) {
          const history: HistoryEvent[] = [];
          for (const entry of wgHistory) {
            history.push({ type: 'join', clan_tag: entry.clan_tag, clan_name: entry.clan_name, timestamp: entry.joined_at, date: new Date(entry.joined_at * 1000).toISOString().split('T')[0], source: 'wg' });
            if (entry.left_at) {
              history.push({ type: 'leave', clan_tag: entry.clan_tag, clan_name: entry.clan_name, timestamp: entry.left_at, date: new Date(entry.left_at * 1000).toISOString().split('T')[0], source: 'wg' });
            }
          }
          history.sort((a, b) => a.timestamp - b.timestamp);
          return ok({ history, source: 'wg', currentClan });
        }
      } catch { /* fall through */ }
    }

    // Tier 3: DB only
    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const dbHistory = await getPlayerHistory(dbResult.db, playerId);
    const history: HistoryEvent[] = dbHistory.map(e => ({ ...e, source: 'db' as const }));
    return ok({ history, source: 'db', currentClan });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
