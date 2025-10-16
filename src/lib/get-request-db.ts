import { NextRequest } from 'next/server';
import { D1Database } from './storage';

// Helper to extract D1 database from Next.js request context
// In OpenNext Cloudflare, bindings are available via the request's cloudflare property
export function getDBFromRequest(request: NextRequest): D1Database | null {
  try {
    // OpenNext adds cloudflare env to the request object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfRequest = request as any;

    // Try various possible locations where the DB binding might be
    if (cfRequest.cloudflare?.env?.DB) {
      return cfRequest.cloudflare.env.DB as D1Database;
    }

    if (cfRequest.env?.DB) {
      return cfRequest.env.DB as D1Database;
    }

    // Try accessing from fetch context
    if (cfRequest.cf?.env?.DB) {
      return cfRequest.cf.env.DB as D1Database;
    }

    console.error('[getDBFromRequest] DB not found in request context');
    console.log('[getDBFromRequest] Available keys:', Object.keys(cfRequest).filter(k => !k.startsWith('_')));

    return null;
  } catch (error) {
    console.error('[getDBFromRequest] Error accessing DB from request:', error);
    return null;
  }
}
