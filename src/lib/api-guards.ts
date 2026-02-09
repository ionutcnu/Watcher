import { NextRequest } from 'next/server';
import { D1Database } from './storage';
import { getDB, getCloudflareEnvSync, getCloudflareEnv } from './cloudflare';
import { WargamingAPI } from './wargaming-api';
import { auth } from './auth';
import { fail, unauthorized, forbidden } from './api-response';

// ── DB Guard ──────────────────────────────────────────────────────────

type DbSuccess = { db: D1Database; error?: never };
type DbFailure = { db?: never; error: ReturnType<typeof fail> };

export async function withDB(): Promise<DbSuccess | DbFailure> {
  const db = await getDB();
  if (!db) {
    return { error: fail('Database configuration error') };
  }
  return { db };
}

// ── Wargaming API Guard ───────────────────────────────────────────────

type ApiSuccess = { api: WargamingAPI; error?: never };
type ApiFailure = { api?: never; error: ReturnType<typeof fail> };

export async function withWargamingAPI(): Promise<ApiSuccess | ApiFailure> {
  const env = await getCloudflareEnv();
  const apiKey = env?.WARGAMING_APPLICATION_ID || process.env.WARGAMING_APPLICATION_ID;

  if (!apiKey) {
    return { error: fail('API configuration error') };
  }
  return { api: new WargamingAPI(apiKey) };
}

// ── Auth Guard ────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  [key: string]: unknown;
}

type AuthSuccess = { user: AuthUser; error?: never };
type AuthFailure = { user?: never; error: ReturnType<typeof unauthorized | typeof forbidden> };

export async function withAuth(request: NextRequest): Promise<AuthSuccess | AuthFailure> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return { error: unauthorized() };
    }

    // Check if user is active (not pending approval)
    const db = await getDB();
    if (db) {
      const dbUser = await db
        .prepare('SELECT active FROM user WHERE id = ?')
        .bind(session.user.id)
        .first<{ active: number }>();

      if (dbUser && dbUser.active === 0) {
        return { error: forbidden('Account pending approval - Please wait for admin to activate your account') };
      }
    }

    return { user: session.user as AuthUser };
  } catch {
    return { error: unauthorized('Authentication failed') };
  }
}

// ── Admin Guard ───────────────────────────────────────────────────────

export async function withAdmin(request: NextRequest): Promise<AuthSuccess | AuthFailure> {
  const authResult = await withAuth(request);
  if (authResult.error) return authResult;

  if (!isAdmin(authResult.user.email)) {
    return { error: forbidden('Admin access required') };
  }
  return authResult;
}

// ── Admin Check (canonical, single source of truth) ───────────────────

export function isAdmin(email: string): boolean {
  const env = getCloudflareEnvSync();
  const adminEmails = env?.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
  return adminEmails.includes(email);
}
