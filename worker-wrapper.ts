/**
 * Custom Cloudflare Worker wrapper that adds scheduled event handling
 * to the OpenNext-generated worker for automated monitoring
 *
 * IMPORTANT: This file is built separately and replaces the OpenNext worker entry point
 * Build process:
 * 1. npm run build:worker (builds Next.js app with OpenNext)
 * 2. Build this file with esbuild to .open-next/worker-scheduled.js
 * 3. Update wrangler.toml main to point to worker-scheduled.js
 */

import { scheduledMonitoring } from './src/scheduled';

// Define the environment interface
export interface Env {
  DB: D1Database;
  WARGAMING_APPLICATION_ID: string;
  WARGAMING_REALM: string;
  WARGAMING_API_BASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ASSETS: any;
  [key: string]: any;
}

// Import the OpenNext worker (will be available after build)
// @ts-ignore - This import happens at runtime after OpenNext build
import openNextWorker from './.open-next/worker.js';

// Export the worker with both fetch and scheduled handlers
export default {
  /**
   * Handle HTTP requests - delegated to OpenNext worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Delegate all HTTP requests to the OpenNext worker
    return openNextWorker.fetch(request, env, ctx);
  },

  /**
   * Handle scheduled events (cron triggers) - automated monitoring
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[Worker] Scheduled event triggered');
    // Use waitUntil to allow monitoring to complete in background
    ctx.waitUntil(scheduledMonitoring(event, env, ctx));
  }
};
