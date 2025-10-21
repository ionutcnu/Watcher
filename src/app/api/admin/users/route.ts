import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { getDB, getCloudflareEnvSync } from '@/lib/cloudflare';
import { auth } from '@/lib/auth';

// Admin check - checks if user email is in ADMIN_EMAILS environment variable
function isAdmin(userEmail: string): boolean {
  const env = getCloudflareEnvSync();
  const adminEmails = env?.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  console.log('[Admin] Checking admin access for:', userEmail);
  console.log('[Admin] Admin emails configured:', adminEmails);
  const hasAccess = adminEmails.includes(userEmail);
  console.log('[Admin] Access granted:', hasAccess);
  return hasAccess;
}

// Get Kysely instance
async function getKysely() {
  const d1 = await getDB();
  return new Kysely({
    dialect: new D1Dialect({ database: d1 }),
  });
}

// List all users
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if user is admin
    if (!isAdmin(authResult.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const db = await getKysely();

    // Get all users (including active status)
    const users = await db
      .selectFrom('user' as never)
      .select(['id', 'email', 'name', 'username', 'emailVerified', 'active', 'createdAt', 'updatedAt'] as never)
      .orderBy('createdAt' as never, 'desc')
      .execute();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create, Update, or Delete user
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if user is admin
    if (!isAdmin(authResult.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { action, ...data } = await request.json();
    const db = await getKysely();

    switch (action) {
      case 'create': {
        // Create new user using Better Auth's internal API
        const { email, password, name, username } = data;

        if (!email || !password) {
          return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existing = await db
          .selectFrom('user' as never)
          .select('id' as never)
          .where('email' as never, '=', email)
          .executeTakeFirst();

        if (existing) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }

        try {
          // Use Better Auth's API to create user (this handles password hashing correctly)
          const result = await auth.api.signUpEmail({
            body: {
              email,
              password,
              name: name || username || email.split('@')[0],
            },
          });

          if (!result) {
            throw new Error('Failed to create user via Better Auth');
          }

          // Get the created user ID from the result
          const userId = (result as { user?: { id: string } })?.user?.id;

          if (!userId) {
            throw new Error('User created but ID not returned');
          }

          // Set user as active (admin-created users are active by default)
          await db
            .updateTable('user' as never)
            .set({ active: 1, updatedAt: Date.now() } as never)
            .where('id' as never, '=' as never, userId as never)
            .execute();

          return NextResponse.json({
            success: true,
            message: 'User created successfully',
            userId,
          });
        } catch (err) {
          console.error('Better Auth user creation error:', err);
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to create user' },
            { status: 500 }
          );
        }
      }

      case 'delete': {
        // Delete user
        const { userId } = data;

        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // Prevent deleting yourself
        if (userId === authResult.user.id) {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 400 }
          );
        }

        // Delete user (cascade will delete sessions and accounts)
        await db
          .deleteFrom('user' as never)
          .where('id' as never, '=', userId)
          .execute();

        return NextResponse.json({
          success: true,
          message: 'User deleted successfully',
        });
      }

      case 'update': {
        // Update user
        const { userId, email, name, username } = data;

        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const updates: {
          updatedAt: number;
          email?: string;
          name?: string | null;
          username?: string | null;
        } = {
          updatedAt: Date.now(),
        };

        if (email !== undefined) updates.email = email;
        if (name !== undefined) updates.name = name || null;
        if (username !== undefined) updates.username = username || null;

        await db
          .updateTable('user' as never)
          .set(updates as never)
          .where('id' as never, '=', userId)
          .execute();

        return NextResponse.json({
          success: true,
          message: 'User updated successfully',
        });
      }

      case 'toggle_active': {
        // Toggle user active status
        const { userId, active } = data;

        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // Prevent deactivating yourself
        if (userId === authResult.user.id) {
          return NextResponse.json(
            { error: 'Cannot deactivate your own account' },
            { status: 400 }
          );
        }

        await db
          .updateTable('user' as never)
          .set({ active: active ? 1 : 0, updatedAt: Date.now() } as never)
          .where('id' as never, '=', userId)
          .execute();

        return NextResponse.json({
          success: true,
          message: `User ${active ? 'activated' : 'deactivated'} successfully`,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('User management error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
