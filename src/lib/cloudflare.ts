import { D1Database } from './storage';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare environment interface
export interface CloudflareEnv {
  DB: D1Database;
  WARGAMING_APPLICATION_ID: string;
  WARGAMING_REALM: string;
  WARGAMING_API_BASE_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  ADMIN_EMAILS?: string;
  ASSETS: unknown;
}

// Get Cloudflare environment using OpenNext's context helper with async mode
export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  try {
    // Use async mode to prevent build-time errors
    const context = await getCloudflareContext({ async: true });
    if (context?.env) {
      return context.env as CloudflareEnv;
    }
    return null;
  } catch (error) {
    // Silently return null - context not available (e.g., during build)
    return null;
  }
}

export async function getDB(): Promise<D1Database | null> {
  const env = await getCloudflareEnv();
  return env?.DB || null;
}

// Synchronous version for Better Auth getters (runs at request time, not build time)
// This will only work after the async context is initialized
export function getDBSync(): D1Database | null {
  try {
    // At request time, context should be available synchronously
    const context = getCloudflareContext();
    return (context?.env as CloudflareEnv)?.DB || null;
  } catch {
    // During build or if context unavailable, return null
    return null;
  }
}

// Synchronous version for admin checks and other runtime-only functions
export function getCloudflareEnvSync(): CloudflareEnv | null {
  try {
    const context = getCloudflareContext();
    return (context?.env as CloudflareEnv) || null;
  } catch {
    // During build or if context unavailable, return null
    return null;
  }
}
