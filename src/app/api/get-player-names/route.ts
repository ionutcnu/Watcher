import { NextRequest } from 'next/server';
import { withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { accountIds } = await request.json();

    if (!accountIds || !Array.isArray(accountIds)) {
      return badRequest('Account IDs array is required');
    }

    const { api, error } = await withWargamingAPI();
    if (error) return error;

    const playerNames = await api.getPlayerNames(accountIds);
    return ok({ playerNames });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
