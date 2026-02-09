import { D1Database } from './storage';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface CloudflareEnv {
  DB: D1Database;
  WARGAMING_APPLICATION_ID: string;
  WARGAMING_REALM: string;
  WARGAMING_API_BASE_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  ADMIN_EMAILS?: string;
  ASSETS: unknown;
}

/** Async env getter -- use in API route handlers and server components. */
export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    return (context?.env as CloudflareEnv) ?? null;
  } catch {
    return null;
  }
}

/** Async DB getter -- preferred in API routes. */
export async function getDB(): Promise<D1Database | null> {
  const env = await getCloudflareEnv();
  return env?.DB ?? null;
}

/** Sync DB getter -- only for Better Auth getters that run at request time, not build time. */
export function getDBSync(): D1Database | null {
  try {
    const context = getCloudflareContext();
    return (context?.env as CloudflareEnv)?.DB ?? null;
  } catch {
    return null;
  }
}

/** Sync env getter -- only for runtime-only helpers (e.g. admin check). */
export function getCloudflareEnvSync(): CloudflareEnv | null {
  try {
    const context = getCloudflareContext();
    return (context?.env as CloudflareEnv) ?? null;
  } catch {
    return null;
  }
}
