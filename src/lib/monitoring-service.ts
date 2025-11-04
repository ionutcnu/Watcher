import { getMonitoredClans, updateClanStatus, getMonitoringConfig } from './monitoring-storage';
import { D1Database } from './storage';

export interface MonitoringResult {
  clan_id: number;
  clan_tag: string;
  clan_name: string;
  error?: string;
  leavers?: Array<{
    player: { account_id: number; account_name: string };
    timestamp: number;
    date: string;
    time: string;
    description: string;
  }>;
  count?: number;
}

export interface MonitoringProgress {
  type: string;
  message: string;
  success?: boolean;
  error?: string;
  current?: number;
  total?: number;
  clan_tag?: string;
  leavers_count?: number;
  clans_checked?: number;
  total_leavers?: number;
  hasMore?: boolean;
  nextBatchStart?: number;
  results?: MonitoringResult[];
}

export type ProgressCallback = (progress: MonitoringProgress) => void;

/**
 * Core monitoring logic that can be used by both manual checks and automated scheduled monitoring
 */
export async function runClanMonitoring(
  db: D1Database,
  options: {
    userId?: string;
    batchStart?: number;
    batchSize?: number;
    onProgress?: ProgressCallback;
  } = {}
): Promise<{
  success: boolean;
  clans_checked: number;
  total_leavers: number;
  results: MonitoringResult[];
  hasMore: boolean;
  nextBatchStart?: number;
  error?: string;
}> {
  const { userId, batchStart = 0, batchSize = 20, onProgress } = options;

  try {
    console.log(`[Monitoring Service] Starting monitoring batch (start: ${batchStart}, size: ${batchSize}, userId: ${userId || 'all'})...`);

    onProgress?.({ type: 'start', message: 'Starting monitoring check...' });

    const monitoredClans = await getMonitoredClans(db, userId);
    console.log('[Monitoring Service] Total monitored clans:', monitoredClans.length);

    const enabledClans = monitoredClans.filter(clan => clan.enabled);
    console.log('[Monitoring Service] Enabled clans:', enabledClans.length);

    // Sort by display_order (Excel import order) to match monitoring list
    enabledClans.sort((a, b) => {
      if (a.display_order === undefined && b.display_order === undefined) return 0;
      if (a.display_order === undefined) return 1;
      if (b.display_order === undefined) return -1;
      return a.display_order - b.display_order;
    });

    if (enabledClans.length === 0) {
      onProgress?.({
        type: 'complete',
        message: 'No enabled clans to monitor',
        success: false,
        error: 'No enabled clans to monitor',
        total: 0,
        clans_checked: 0,
        total_leavers: 0,
        results: []
      });
      return {
        success: false,
        clans_checked: 0,
        total_leavers: 0,
        results: [],
        hasMore: false,
        error: 'No enabled clans to monitor'
      };
    }

    // Get the batch of clans to process
    const batchEnd = Math.min(batchStart + batchSize, enabledClans.length);
    const batchClans = enabledClans.slice(batchStart, batchEnd);
    const totalClans = enabledClans.length;
    const hasMore = batchEnd < totalClans;

    console.log(`[Monitoring Service] Processing clans ${batchStart + 1}-${batchEnd} of ${totalClans}`);

    onProgress?.({
      type: 'info',
      message: `Processing clans ${batchStart + 1}-${batchEnd} of ${totalClans}...`,
      total: totalClans
    });

    const allResults: MonitoringResult[] = [];
    let totalLeavers = 0;
    let totalClansChecked = 0;

    for (const clan of batchClans) {
      try {
        console.log(`[Monitoring Service] Checking clan: [${clan.tag}] ${clan.name}`);
        onProgress?.({
          type: 'clan_start',
          message: `Checking clan [${clan.tag}] ${clan.name} (${batchStart + totalClansChecked + 1}/${totalClans})`,
          current: batchStart + totalClansChecked + 1,
          total: totalClans
        });

        // Call the Wargaming API newsfeed endpoint
        const now = new Date();
        const dateUntil = now.toISOString().split('.')[0] + '+00:00';
        const offset = Math.abs(now.getTimezoneOffset() * 60);
        const url = `https://eu.wargaming.net/clans/wot/${clan.clan_id}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

        console.log(`[Monitoring Service] Fetching from API:`, url);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });

        if (!response.ok) {
          console.error(`[Monitoring Service] Failed to fetch for clan ${clan.tag}:`, response.status);
          await updateClanStatus(db, clan.clan_id, {
            status: 'error',
            last_checked: new Date().toISOString()
          }, userId);
          allResults.push({
            clan_id: clan.clan_id,
            clan_tag: clan.tag,
            clan_name: clan.name,
            error: `Failed to fetch clan history (${response.status})`,
            leavers: []
          });
          totalClansChecked++;
          continue;
        }

        const rawData = await response.json();
        console.log(`[Monitoring Service] Got data for ${clan.tag}, items:`, rawData?.items?.length || 0);

        // Parse events for leave_clan only
        const leavers: Array<{
          player: { account_id: number; account_name: string };
          timestamp: number;
          date: string;
          time: string;
          description: string;
        }> = [];
        const allAccountIds = new Set<number>();

        if (rawData?.items && Array.isArray(rawData.items)) {
          // First pass: collect account IDs for leave events
          for (const item of rawData.items) {
            if (item.subtype === 'leave_clan' && item.accounts_ids) {
              item.accounts_ids.forEach((id: number) => allAccountIds.add(id));
            }
          }

          // Fetch player names for all account IDs
          let playerNames: Record<number, string> = {};
          if (allAccountIds.size > 0) {
            console.log(`[Monitoring Service] Fetching names for ${allAccountIds.size} accounts`);

            const { getWargamingAPI } = await import('./api-helpers');
            const api = await getWargamingAPI();
            if (api) {
              playerNames = await api.getPlayerNames(Array.from(allAccountIds));
            }

            console.log(`[Monitoring Service] Got ${Object.keys(playerNames).length} player names`);

            // Second pass: build leave events with names
            for (const item of rawData.items) {
              if (item.subtype === 'leave_clan' && item.accounts_ids) {
                const timestamp = new Date(item.created_at).getTime() / 1000;

                for (const accountId of item.accounts_ids) {
                  const playerName = playerNames[accountId] || `Player_${accountId}`;

                  leavers.push({
                    player: {
                      account_id: accountId,
                      account_name: playerName
                    },
                    timestamp: timestamp,
                    date: new Date(timestamp * 1000).toISOString().split('T')[0],
                    time: new Date(timestamp * 1000).toLocaleString(),
                    description: `Player ${playerName} has been excluded from this clan.`
                  });
                }
              }
            }
          }
        }

        console.log(`[Monitoring Service] Found ${leavers.length} leavers from [${clan.tag}]`);

        // Sort by timestamp (newest first)
        leavers.sort((a, b) => b.timestamp - a.timestamp);

        const clanResult: MonitoringResult = {
          clan_id: clan.clan_id,
          clan_tag: clan.tag,
          clan_name: clan.name,
          leavers: leavers,
          count: leavers.length
        };

        allResults.push(clanResult);
        totalLeavers += leavers.length;

        // Update clan status
        await updateClanStatus(db, clan.clan_id, {
          status: 'active',
          last_checked: new Date().toISOString(),
          last_member_count: leavers.length
        }, userId);

        totalClansChecked++;
        console.log(`[Monitoring Service] Completed ${clan.tag}: ${leavers.length} leavers`);

        onProgress?.({
          type: 'clan_complete',
          message: `Completed [${clan.tag}]: ${leavers.length} leavers found (${batchStart + totalClansChecked}/${totalClans})`,
          clan_tag: clan.tag,
          leavers_count: leavers.length,
          current: batchStart + totalClansChecked,
          total: totalClans
        });

        // Add delay to respect rate limits (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`[Monitoring Service] Error checking clan ${clan.tag}:`, error);
        await updateClanStatus(db, clan.clan_id, {
          status: 'error',
          last_checked: new Date().toISOString()
        }, userId);
        const errorResult: MonitoringResult = {
          clan_id: clan.clan_id,
          clan_tag: clan.tag,
          clan_name: clan.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          leavers: []
        };
        allResults.push(errorResult);
        totalClansChecked++;
      }
    }

    const progressMessage = hasMore
      ? `Batch complete: ${totalClansChecked} clans checked (${batchStart + 1}-${batchEnd} of ${totalClans}). Processing next batch...`
      : `Monitoring check complete: ${batchEnd} clans checked, ${totalLeavers} total leavers found.`;

    onProgress?.({
      type: hasMore ? 'batch_complete' : 'complete',
      success: true,
      message: progressMessage,
      clans_checked: totalClansChecked,
      total_leavers: totalLeavers,
      results: allResults,
      total: totalClans,
      current: batchEnd,
      hasMore: hasMore,
      nextBatchStart: hasMore ? batchEnd : undefined
    });

    return {
      success: true,
      clans_checked: totalClansChecked,
      total_leavers: totalLeavers,
      results: allResults,
      hasMore: hasMore,
      nextBatchStart: hasMore ? batchEnd : undefined
    };

  } catch (error) {
    console.error('[Monitoring Service] Top-level error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    onProgress?.({
      type: 'error',
      message: 'Monitoring check failed',
      success: false,
      error: errorMessage
    });

    return {
      success: false,
      clans_checked: 0,
      total_leavers: 0,
      results: [],
      hasMore: false,
      error: errorMessage
    };
  }
}

/**
 * Send Discord notifications for monitoring results
 */
export async function sendDiscordNotifications(
  db: D1Database,
  results: MonitoringResult[]
): Promise<void> {
  try {
    const config = await getMonitoringConfig(db);

    if (!config.discord_webhook_url) {
      console.log('[Monitoring Service] No Discord webhook configured, skipping notifications');
      return;
    }

    // Filter results that have leavers and notifications are enabled
    const resultsWithLeavers = results.filter(r =>
      r.leavers && r.leavers.length > 0 && config.notification_types.player_left
    );

    if (resultsWithLeavers.length === 0) {
      console.log('[Monitoring Service] No leavers to notify');
      return;
    }

    // Create notification message
    const totalLeavers = resultsWithLeavers.reduce((sum, r) => sum + (r.count || 0), 0);

    const embed = {
      title: '🚨 Clan Monitoring Alert',
      description: `Found ${totalLeavers} player(s) leaving ${resultsWithLeavers.length} clan(s)`,
      color: 0xFF0000, // Red
      fields: resultsWithLeavers.slice(0, 10).map(result => ({
        name: `[${result.clan_tag}] ${result.clan_name}`,
        value: result.leavers!.slice(0, 5).map(l =>
          `• ${l.player.account_name} (${l.time})`
        ).join('\n') + (result.leavers!.length > 5 ? `\n...and ${result.leavers!.length - 5} more` : ''),
        inline: false
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'WoT Clan Watcher'
      }
    };

    if (resultsWithLeavers.length > 10) {
      embed.fields.push({
        name: 'Additional Clans',
        value: `...and ${resultsWithLeavers.length - 10} more clans with activity`,
        inline: false
      });
    }

    console.log('[Monitoring Service] Sending Discord notification...');

    const response = await fetch(config.discord_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!response.ok) {
      console.error('[Monitoring Service] Failed to send Discord notification:', response.status, await response.text());
    } else {
      console.log('[Monitoring Service] Discord notification sent successfully');
    }

  } catch (error) {
    console.error('[Monitoring Service] Error sending Discord notifications:', error);
  }
}
