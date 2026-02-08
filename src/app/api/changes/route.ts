import { NextRequest } from 'next/server';
import { getRecentChanges } from '@/lib/storage';
import { withDB } from '@/lib/api-guards';
import { ok, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(new URL(request.url).searchParams.get('days') || '7');

    const { db, error } = await withDB();
    if (error) return error;

    const changes = await getRecentChanges(db, days);
    return ok({ changes });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
