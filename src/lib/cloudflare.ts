import { D1Database } from './storage';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare environment interface
export interface CloudflareEnv {
  DB: D1Database;
  WARGAMING_APPLICATION_ID: string;
  WARGAMING_REALM: string;
  WARGAMING_API_BASE_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  ASSETS: unknown;
}

// Get Cloudflare environment using OpenNext's context helper
export function getCloudflareEnv(): CloudflareEnv | null {
  try {
    // Use OpenNext's getCloudflareContext to access bindings
    const context = getCloudflareContext();
    if (context?.env) {
      return context.env as CloudflareEnv;
    }

    console.error('[Cloudflare] No context.env available from getCloudflareContext()');
    return null;
  } catch (error) {
    console.error('[Cloudflare] Error getting Cloudflare context:', error);
    return null;
  }
}

export function getDB(): D1Database | null {
  const env = getCloudflareEnv();
  if (!env?.DB) {
    console.error('[Cloudflare] Failed to get D1 database binding from context');
  }
  return env?.DB || null;
}
