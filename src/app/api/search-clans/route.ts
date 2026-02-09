import { NextRequest } from 'next/server';
import { withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const search = new URL(request.url).searchParams.get('search');
    if (!search) return badRequest('Search parameter is required');

    const apiResult = await withWargamingAPI();
    if (apiResult.error) return apiResult.error;
    const { api } = apiResult;

    const clans = await api.searchClans(search, 10);
    return ok({ clans });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
