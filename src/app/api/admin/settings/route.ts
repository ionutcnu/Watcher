import { NextRequest } from 'next/server';
import { withDB, withAdmin } from '@/lib/api-guards';
import { ok, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const admin = await withAdmin(request);
    if (admin.error) return admin.error;

    const { db, error } = await withDB();
    if (error) return error;

    const config = await db
      .prepare('SELECT signup_enabled FROM monitoring_config WHERE id = 1')
      .first<{ signup_enabled: number }>();

    return ok({
      settings: {
        signupEnabled: config?.signup_enabled === 1,
      },
    });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await withAdmin(request);
    if (admin.error) return admin.error;

    const { signupEnabled } = await request.json();

    const { db, error } = await withDB();
    if (error) return error;

    await db
      .prepare('UPDATE monitoring_config SET signup_enabled = ? WHERE id = 1')
      .bind(signupEnabled ? 1 : 0)
      .run();

    return ok({ message: `Sign-up ${signupEnabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
