/**
 * Scheduled monitoring handler for Cloudflare Workers Cron Triggers
 *
 * This file provides the scheduled event handler that runs automated
 * clan monitoring at regular intervals configured in wrangler.toml
 */

import { runClanMonitoring, sendDiscordNotifications } from './lib/monitoring-service';
import { getMonitoringConfig, saveMonitoringConfig } from './lib/monitoring-storage';

export interface Env {
  DB: D1Database;
  WARGAMING_APPLICATION_ID: string;
  WARGAMING_REALM: string;
  WARGAMING_API_BASE_URL: string;
}

/**
 * Cloudflare Workers scheduled event handler
 * Called automatically by Cloudflare Workers cron triggers
 */
export async function scheduledMonitoring(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log('[Scheduled Monitoring] Starting automated monitoring check...');
  console.log('[Scheduled Monitoring] Cron:', event.cron);
  console.log('[Scheduled Monitoring] Scheduled time:', new Date(event.scheduledTime).toISOString());

  try {
    const db = env.DB;
    if (!db) {
      console.error('[Scheduled Monitoring] D1 database binding not found');
      return;
    }

    // Get monitoring configuration
    const config = await getMonitoringConfig(db);
    console.log('[Scheduled Monitoring] Config:', {
      check_interval: config.check_interval,
      notification_types: config.notification_types,
      last_global_check: config.last_global_check
    });

    // Check if we should run based on check_interval
    const now = new Date();
    const lastCheck = config.last_global_check ? new Date(config.last_global_check) : null;

    if (lastCheck) {
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
      console.log('[Scheduled Monitoring] Hours since last check:', hoursSinceLastCheck);

      // If check_interval is 'daily' and last check was less than 23 hours ago, skip
      if (config.check_interval === 'daily' && hoursSinceLastCheck < 23) {
        console.log('[Scheduled Monitoring] Skipping: last check was too recent for daily interval');
        return;
      }

      // If check_interval is 'hourly' and last check was less than 50 minutes ago, skip
      if (config.check_interval === 'hourly' && hoursSinceLastCheck < 0.83) {
        console.log('[Scheduled Monitoring] Skipping: last check was too recent for hourly interval');
        return;
      }
    }

    // Run monitoring for all users (no userId filter = check all enabled clans)
    const allResults = [];
    let batchStart = 0;
    const batchSize = 20;
    let hasMore = true;

    console.log('[Scheduled Monitoring] Starting batch processing...');

    // Process all enabled clans in batches
    while (hasMore) {
      console.log(`[Scheduled Monitoring] Processing batch starting at ${batchStart}...`);

      const result = await runClanMonitoring(db, {
        userId: undefined, // Check all users' clans
        batchStart,
        batchSize,
        onProgress: (progress) => {
          console.log(`[Scheduled Monitoring] Progress:`, {
            type: progress.type,
            message: progress.message,
            current: progress.current,
            total: progress.total
          });
        }
      });

      if (result.results) {
        allResults.push(...result.results);
      }

      hasMore = result.hasMore;
      if (result.nextBatchStart !== undefined) {
        batchStart = result.nextBatchStart;
      }

      console.log(`[Scheduled Monitoring] Batch complete. Has more: ${hasMore}, Next batch start: ${result.nextBatchStart}`);

      // Add delay between batches to respect rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[Scheduled Monitoring] All batches complete. Total results: ${allResults.length}`);

    // Send Discord notifications if configured
    if (allResults.length > 0) {
      await sendDiscordNotifications(db, allResults);
    }

    // Update last_global_check timestamp
    await saveMonitoringConfig(db, {
      ...config,
      last_global_check: now.toISOString()
    });

    console.log('[Scheduled Monitoring] Completed successfully');
    console.log('[Scheduled Monitoring] Summary:', {
      total_clans_checked: allResults.length,
      total_leavers: allResults.reduce((sum, r) => sum + (r.count || 0), 0),
      clans_with_leavers: allResults.filter(r => r.leavers && r.leavers.length > 0).length
    });

  } catch (error) {
    console.error('[Scheduled Monitoring] Error during scheduled monitoring:', error);
    // Don't throw - we don't want to trigger Cloudflare Workers error alerts for monitoring failures
  }
}
