import { NextRequest } from 'next/server';
import { getMonitoringConfig, saveMonitoringConfig } from '@/lib/monitoring-storage';
import { withDB, withAuth, withAdmin } from '@/lib/api-guards';
import { ok, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const config = await getMonitoringConfig(db);

    // Redact sensitive webhook URL for non-admin users
    return ok({ config });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await withAdmin(request);
    if (admin.error) return admin.error;

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const config = await request.json();
    await saveMonitoringConfig(db, config);
    return ok({ message: 'Configuration saved' });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
