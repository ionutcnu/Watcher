import { NextRequest } from 'next/server';
import { fetchTomatoClanStats } from '@/lib/tomato-api';
import { withDB, withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, notFound, serverError } from '@/lib/api-response';
import { getMonitoredClans } from '@/lib/monitoring-storage';
import type { MonitoredClan } from '@/types/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clanIdStr = searchParams.get('clan_id');
    const region = searchParams.get('region') || 'eu';

    if (!clanIdStr) {
      return badRequest('clan_id is required');
    }

    const clanId = parseInt(clanIdStr, 10);
    if (isNaN(clanId)) {
      return badRequest('clan_id must be a number');
    }

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const wgResult = await withWargamingAPI();
    if (wgResult.error) return wgResult.error;
    const { api: wargamingApi } = wgResult;

    // Get clan info from DB to get the tag
    const monitoredClans = await getMonitoredClans(db);
    const clan = monitoredClans.find((c: MonitoredClan) => c.clan_id === clanId);

    if (!clan) {
      return notFound('Clan not found in monitored clans');
    }

    // Fetch stats from Tomato.gg (WN8, winrate, rating)
    const stats = await fetchTomatoClanStats(region, clanId, clan.tag);

    if (!stats) {
      return serverError('Failed to fetch clan stats from Tomato.gg');
    }

    // Fetch average damage from Wargaming clan page
    let avg_damage: number | null = null;
    try {
      const clanPageInfo = await wargamingApi.getClanPageInfo(clanId, region);
      avg_damage = clanPageInfo.avg_damage;
    } catch {
      // Silently fail, return stats without avg_damage
    }

    return ok({ stats: { ...stats, avg_damage } });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
