import { withDB } from '@/lib/api-guards';
import { ok, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const { db, error } = await withDB();
    if (error) return ok({ enabled: false });

    const config = await db
      .prepare('SELECT signup_enabled FROM monitoring_config WHERE id = 1')
      .first<{ signup_enabled: number }>();

    return ok({ enabled: config?.signup_enabled === 1 });
  } catch {
    return serverError('Failed to check signup status');
  }
}
