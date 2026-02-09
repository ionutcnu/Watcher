import { NextRequest } from 'next/server';
import { withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const clanIdsParam = new URL(request.url).searchParams.get('clan_ids');
    if (!clanIdsParam) return badRequest('clan_ids parameter is required');

    const clanIds = clanIdsParam.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
    if (clanIds.length === 0) return badRequest('No valid clan IDs provided');
    if (clanIds.length > 100) return badRequest('Maximum 100 clan IDs per request');

    const { api, error } = await withWargamingAPI();
    if (error) return error;

    // Fetch ratings from clan page info (includes rating + avg damage)
    const ratings: Record<number, number | null> = {};

    // Fetch in parallel but with reasonable batching to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < clanIds.length; i += BATCH_SIZE) {
      const batch = clanIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (clanId) => {
          try {
            const info = await api.getClanPageInfo(clanId, 'eu');
            return { clanId, rating: info.rating };
          } catch {
            return { clanId, rating: null };
          }
        })
      );

      for (const { clanId, rating } of results) {
        ratings[clanId] = rating;
      }
    }

    return ok({ ratings });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
