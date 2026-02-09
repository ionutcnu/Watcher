import { NextRequest } from 'next/server';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { withDB, withAdmin } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await withAdmin(request);
    if (admin.error) return admin.error;

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const kysely = new Kysely({ dialect: new D1Dialect({ database: db }) });

    const users = await kysely
      .selectFrom('user' as never)
      .select(['id', 'email', 'name', 'username', 'emailVerified', 'active', 'createdAt', 'updatedAt'] as never)
      .orderBy('createdAt' as never, 'desc')
      .execute();

    return ok({ users });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await withAdmin(request);
    if (admin.error) return admin.error;

    const { db, error } = await withDB();
    if (error) return error;

    const kysely = new Kysely({ dialect: new D1Dialect({ database: db }) });
    const { action, ...data } = await request.json();

    switch (action) {
      case 'create': {
        const { email, password, name, username } = data;
        if (!email || !password) return badRequest('Email and password are required');

        const existing = await kysely
          .selectFrom('user' as never)
          .select('id' as never)
          .where('email' as never, '=', email)
          .executeTakeFirst();

        if (existing) return badRequest('User with this email already exists');

        const result = await auth.api.signUpEmail({
          body: {
            email,
            password,
            name: name || username || email.split('@')[0],
          },
        });

        if (!result) return serverError('Failed to create user via Better Auth');

        const userId = (result as { user?: { id: string } })?.user?.id;
        if (!userId) return serverError('User created but ID not returned');

        await kysely
          .updateTable('user' as never)
          .set({ active: 1, updatedAt: Date.now() } as never)
          .where('id' as never, '=' as never, userId as never)
          .execute();

        return ok({ message: 'User created successfully', userId });
      }

      case 'delete': {
        const { userId } = data;
        if (!userId) return badRequest('User ID is required');
        if (userId === admin.user.id) return badRequest('Cannot delete your own account');

        // Delete user's monitored clans first (FK integrity)
        await kysely
          .deleteFrom('monitored_clans' as never)
          .where('user_id' as never, '=', userId)
          .execute();

        await kysely
          .deleteFrom('user' as never)
          .where('id' as never, '=', userId)
          .execute();

        return ok({ message: 'User deleted successfully' });
      }

      case 'update': {
        const { userId, email, name, username } = data;
        if (!userId) return badRequest('User ID is required');

        const updates: { updatedAt: number; email?: string; name?: string | null; username?: string | null } = {
          updatedAt: Date.now(),
        };

        if (email !== undefined) updates.email = email;
        if (name !== undefined) updates.name = name || null;
        if (username !== undefined) updates.username = username || null;

        await kysely
          .updateTable('user' as never)
          .set(updates as never)
          .where('id' as never, '=', userId)
          .execute();

        return ok({ message: 'User updated successfully' });
      }

      case 'toggle_active': {
        const { userId, active } = data;
        if (!userId) return badRequest('User ID is required');
        if (userId === admin.user.id) return badRequest('Cannot deactivate your own account');

        await kysely
          .updateTable('user' as never)
          .set({ active: active ? 1 : 0, updatedAt: Date.now() } as never)
          .where('id' as never, '=', userId)
          .execute();

        return ok({ message: `User ${active ? 'activated' : 'deactivated'} successfully` });
      }

      default:
        return badRequest('Invalid action');
    }
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
