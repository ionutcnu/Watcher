import { NextRequest } from 'next/server';
import { getMonitoringConfig, saveMonitoringConfig } from '@/lib/monitoring-storage';
import { withDB } from '@/lib/api-guards';
import { ok, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const { db, error } = await withDB();
    if (error) return error;

    const config = await getMonitoringConfig(db);
    return ok({ config });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db, error } = await withDB();
    if (error) return error;

    const config = await request.json();
    await saveMonitoringConfig(db, config);
    return ok({ message: 'Configuration saved' });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
