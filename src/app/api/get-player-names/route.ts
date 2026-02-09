import { NextRequest } from 'next/server';
import { withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

const MAX_ACCOUNT_IDS = 100;

export async function POST(request: NextRequest) {
  try {
    const { accountIds } = await request.json();

    if (!accountIds || !Array.isArray(accountIds)) {
      return badRequest('Account IDs array is required');
    }

    if (accountIds.length > MAX_ACCOUNT_IDS) {
      return badRequest(`Cannot fetch more than ${MAX_ACCOUNT_IDS} player names at once`);
    }

    const apiResult = await withWargamingAPI();
    if (apiResult.error) return apiResult.error;
    const { api } = apiResult;

    const playerNames = await api.getPlayerNames(accountIds);
    return ok({ playerNames });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
