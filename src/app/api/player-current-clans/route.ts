import { NextRequest } from 'next/server';
import { withWargamingAPI, withAuth } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const raw = url.searchParams.get('accountIds') ?? '';
    const accountIds = [...new Set(raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0))];

    if (accountIds.length === 0) return badRequest('accountIds required');
    if (accountIds.length > 100) return badRequest('Max 100 accountIds');

    const wgResult = await withWargamingAPI();
    if (wgResult.error) return wgResult.error;

    const clans = await wgResult.api.getPlayerCurrentClans(accountIds);
    return ok({ clans });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
