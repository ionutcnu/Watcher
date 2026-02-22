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

    const emblems = await api.getClanEmblems(clanIds);
    return ok({ emblems });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
