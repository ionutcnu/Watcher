import { NextRequest } from 'next/server';
import { withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const search = new URL(request.url).searchParams.get('search');
    if (!search) return badRequest('Search parameter is required');

    const { api, error } = await withWargamingAPI();
    if (error) return error;

    const clans = await api.searchClans(search, 10);
    return ok({ clans });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
