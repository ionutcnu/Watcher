import { NextRequest } from 'next/server';
import { getLatestSnapshot, saveSnapshot, saveChanges } from '@/lib/storage';
import { detectChanges, createSnapshot } from '@/lib/change-detector';
import { withDB, withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, notFound, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { clanId } = await request.json();
    if (!clanId) return badRequest('Clan ID is required');

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const apiResult = await withWargamingAPI();
    if (apiResult.error) return apiResult.error;
    const { api } = apiResult;

    const currentClan = await api.getClanInfo(clanId);
    if (!currentClan) return notFound('Clan not found');

    const previousSnapshot = await getLatestSnapshot(db, clanId);
    const changes = detectChanges(previousSnapshot, currentClan);

    const newSnapshot = createSnapshot(currentClan);
    await saveSnapshot(db, newSnapshot);

    if (changes.length > 0) {
      await saveChanges(db, changes);
    }

    return ok({
      clan: currentClan,
      changes,
      summary: {
        total_members: currentClan.members.length,
        joins: changes.filter(c => c.type === 'join').length,
        leaves: changes.filter(c => c.type === 'leave').length
      }
    });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
