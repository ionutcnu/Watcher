import { NextRequest } from 'next/server';
import { withWargamingAPI, withAuth } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const accountId = parseInt(url.searchParams.get('accountId') || '', 10);
    if (isNaN(accountId) || accountId <= 0) return badRequest('Invalid accountId');

    const wgResult = await withWargamingAPI();
    if (wgResult.error) return wgResult.error;

    const clan = await wgResult.api.getPlayerCurrentClan(accountId);
    return ok({ clan });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
