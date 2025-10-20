import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { getDB, getCloudflareEnv } from '@/lib/cloudflare';
import crypto from 'crypto';

// Admin check - checks if user email is in ADMIN_EMAILS environment variable
function isAdmin(userEmail: string): boolean {
  const env = getCloudflareEnv();
  const adminEmails = env?.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  console.log('[Admin] Checking admin access for:', userEmail);
  console.log('[Admin] Admin emails configured:', adminEmails);
  const hasAccess = adminEmails.includes(userEmail);
  console.log('[Admin] Access granted:', hasAccess);
  return hasAccess;
}

// Get Kysely instance
function getKysely() {
  const d1 = getDB();
  return new Kysely({
    dialect: new D1Dialect({ database: d1 }),
  });
}

// Hash password using Better Auth's method (bcrypt-like)
async function hashPassword(password: string): Promise<string> {
  // Better Auth uses bcrypt, but for simplicity we'll use a basic hash
  // In production, Better Auth handles this internally
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
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

    const db = getKysely();

    // Get all users
    const users = await db
      .selectFrom('user')
      .select(['id', 'email', 'name', 'username', 'emailVerified', 'createdAt', 'updatedAt'])
      .orderBy('createdAt', 'desc')
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
    const db = getKysely();

    switch (action) {
      case 'create': {
        // Create new user
        const { email, password, name, username } = data;

        if (!email || !password) {
          return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existing = await db
          .selectFrom('user')
          .select('id')
          .where('email', '=', email)
          .executeTakeFirst();

        if (existing) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }

        // Generate user ID
        const userId = crypto.randomUUID();
        const now = Date.now();

        // Create user record
        await db
          .insertInto('user')
          .values({
            id: userId,
            email,
            name: name || null,
            username: username || null,
            emailVerified: 0,
            createdAt: now,
            updatedAt: now,
            image: null,
          })
          .execute();

        // Create account record with hashed password
        const accountId = crypto.randomUUID();
        const hashedPassword = await hashPassword(password);

        await db
          .insertInto('account')
          .values({
            id: accountId,
            userId,
            accountId: email, // Use email as accountId for email/password
            providerId: 'credential', // Better Auth uses 'credential' for email/password
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .execute();

        return NextResponse.json({
          success: true,
          message: 'User created successfully',
          userId,
        });
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
          .deleteFrom('user')
          .where('id', '=', userId)
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

        const updates: any = {
          updatedAt: Date.now(),
        };

        if (email !== undefined) updates.email = email;
        if (name !== undefined) updates.name = name || null;
        if (username !== undefined) updates.username = username || null;

        await db
          .updateTable('user')
          .set(updates)
          .where('id', '=', userId)
          .execute();

        return NextResponse.json({
          success: true,
          message: 'User updated successfully',
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
