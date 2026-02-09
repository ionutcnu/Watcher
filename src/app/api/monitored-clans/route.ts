import { NextRequest } from 'next/server';
import { getMonitoredClans, addMonitoredClan, removeMonitoredClan, updateClanStatus } from '@/lib/monitoring-storage';
import { withDB, withAuth } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const clans = await getMonitoredClans(db, auth.user.id);
    return ok({ clans });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const { action, ...data } = await request.json();

    if (!action || typeof action !== 'string') {
      return badRequest('Action is required');
    }

    switch (action) {
      case 'add':
        if (!data.clan_id || !data.tag || !data.name) {
          return badRequest('Missing required fields: clan_id, tag, name');
        }
        await addMonitoredClan(db, { ...data, user_id: auth.user.id });
        return ok({ message: 'Clan added to monitoring list' });

      case 'remove':
        if (!data.clanId) {
          return badRequest('clanId is required');
        }
        await removeMonitoredClan(db, data.clanId, auth.user.id);
        return ok({ message: 'Clan removed from monitoring list' });

      case 'update':
        if (!data.clanId || !data.updates) {
          return badRequest('clanId and updates are required');
        }
        await updateClanStatus(db, data.clanId, data.updates, auth.user.id);
        return ok({ message: 'Clan status updated' });

      default:
        return badRequest('Invalid action');
    }
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
