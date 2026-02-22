import { withDB } from '@/lib/api-guards';
import { ok, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // milliseconds

    const [clansResult, changesResult] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM monitored_clans').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM changes WHERE timestamp >= ?').bind(thirtyDaysAgo).first<{ count: number }>(),
    ]);

    return ok({
      clansTracked: clansResult?.count ?? 0,
      changesThisMonth: changesResult?.count ?? 0,
    });
  } catch {
    return serverError('Failed to fetch stats');
  }
}
