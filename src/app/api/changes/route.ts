import { NextRequest } from 'next/server';
import { getRecentChanges } from '@/lib/storage';
import { withDB } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const daysParam = new URL(request.url).searchParams.get('days') || '7';
    const days = parseInt(daysParam, 10);

    if (isNaN(days) || days < 1) {
      return badRequest('Invalid days parameter');
    }

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const changes = await getRecentChanges(db, days);
    return ok({ changes });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
