import { NextResponse } from 'next/server';
import { getMonitoredClans, updateClanStatus } from '@/lib/monitoring-storage';

interface TomatoPlayerStats {
  battles: number;
  avgTier: number;
  wn8: number;
  wnx: number;
  wins: number;
  winrate: number;
  survived: number;
  survivalRate: number;
  damage: number;
  avgDamage: number;
  damageRatio: number;
  frags: number;
  avgFrags: number;
  kdRatio: number;
}

interface ProgressData {
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
  results?: Array<{
    clan_id: number;
    clan_tag: string;
    clan_name: string;
    error?: string;
    leavers?: unknown[];
    count?: number;
  }>;
}

async function fetchTomatoStats(
  region: string,
  accountId: number,
  days: number = 60
): Promise<TomatoPlayerStats | null> {
  try {
    const url = `https://api.tomato.gg/dev/api-v2/player/recents/${region}/${accountId}?cache=false&days=1,3,7,30,60&battles=1000,100`;

    console.log(`[Tomato] Fetching stats for ${accountId} from ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`[Tomato] HTTP ${response.status} for account ${accountId}`);
      return null;
    }

    const data = await response.json();
    console.log(`[Tomato] Full response structure for ${accountId}:`, {
      hasData: !!data.data,
      dataKeys: data?.data ? Object.keys(data.data) : [],
      hasDays: !!data?.data?.days,
      daysKeys: data?.data?.days ? Object.keys(data.data.days) : [],
      daysType: data?.data?.days ? typeof data.data.days : 'undefined',
      requestedDayKey: days,
      has60DayData: !!data?.data?.days?.[60],
      has60DayStringData: !!data?.data?.days?.['60']
    });

    // The structure is data.data.days[60], not data[60]
    const stats60Days = data?.data?.days?.[days];

    if (!stats60Days?.overall) {
      console.log(`[Tomato] No 60-day stats found for ${accountId}.`);
      console.log(`[Tomato] data.data.days keys:`, Object.keys(data?.data?.days || {}));
      console.log(`[Tomato] Attempted to access days[${days}], got:`, stats60Days);
      return null;
    }

    console.log(`[Tomato] Successfully parsed 60-day stats for ${accountId}`);


    const overall = stats60Days.overall;
    const ratios = stats60Days.ratios;

    const battles = overall.battles || 0;
    const wins = overall.wins || 0;
    const survived = overall.totalSurvived || 0;
    const damage = overall.totalDamage || 0;
    const frags = overall.totalFrags || 0;

    return {
      battles,
      avgTier: overall.tier || 0,
      wn8: ratios?.wn8 || overall.wn8 || 0,
      wnx: overall.wnx || 0,
      wins,
      winrate: battles > 0 ? (wins / battles) * 100 : 0,
      survived,
      survivalRate: battles > 0 ? (survived / battles) * 100 : 0,
      damage,
      avgDamage: battles > 0 ? damage / battles : 0,
      damageRatio: ratios?.rDMG || 0,
      frags,
      avgFrags: battles > 0 ? frags / battles : 0,
      kdRatio: (battles - survived) > 0 ? frags / (battles - survived) : 0,
    };
  } catch (error) {
    console.error(`[Tomato API] Error fetching stats for ${accountId}:`, error);
    return null;
  }
}

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send progress updates
      const sendProgress = (data: ProgressData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        console.log('[Manual Check] Starting manual check...');
        sendProgress({ type: 'start', message: 'Starting manual check...' });

        const monitoredClans = await getMonitoredClans();
        console.log('[Manual Check] Total monitored clans:', monitoredClans.length);

        const enabledClans = monitoredClans.filter(clan => clan.enabled);
        console.log('[Manual Check] Enabled clans:', enabledClans.length);

        sendProgress({
          type: 'info',
          message: `Found ${enabledClans.length} enabled clans to check`
        });

        if (enabledClans.length === 0) {
          sendProgress({
            type: 'complete',
            message: 'No enabled clans to monitor',
            success: false,
            error: 'No enabled clans to monitor'
          });
          controller.close();
          return;
        }

        const results = [];
        let totalLeavers = 0;
        let clansChecked = 0;

        for (const clan of enabledClans) {
          try {
            console.log(`[Manual Check] Checking clan: [${clan.tag}] ${clan.name}`);
            sendProgress({
              type: 'clan_start',
              message: `Checking clan [${clan.tag}] ${clan.name}`,
              current: clansChecked + 1,
              total: enabledClans.length
            });

        // Call the Wargaming API newsfeed endpoint (same as history page)
        const now = new Date();
        const dateUntil = now.toISOString();
        const offset = Math.abs(now.getTimezoneOffset() * 60);

        const url = `https://eu.wargaming.net/clans/wot/${clan.clan_id}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

        console.log(`[Manual Check] Fetching from proxy:`, url);

        // Call the Wargaming API directly instead of using proxy
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });

        if (!response.ok) {
          console.error(`[Manual Check] Failed to fetch for clan ${clan.tag}:`, response.status);
          await updateClanStatus(clan.clan_id, {
            status: 'error',
            last_checked: new Date().toISOString()
          });
          results.push({
            clan_id: clan.clan_id,
            clan_tag: clan.tag,
            clan_name: clan.name,
            error: `Failed to fetch clan history (${response.status})`,
            leavers: []
          });
          continue;
        }

        const rawData = await response.json();
        console.log(`[Manual Check] Got data for ${clan.tag}, items:`, rawData?.items?.length || 0);

        // Parse events for leave_clan only (same logic as history page)
        const leavers: Array<{
          player: { account_id: number; account_name: string };
          timestamp: number;
          date: string;
          time: string;
          description: string;
          stats: TomatoPlayerStats | null;
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
            console.log(`[Manual Check] Fetching names for ${allAccountIds.size} accounts`);

            // Import WargamingAPI to fetch names directly
            const { WargamingAPI } = await import('@/lib/wargaming-api');
            const api = new WargamingAPI();
            playerNames = await api.getPlayerNames(Array.from(allAccountIds));

            console.log(`[Manual Check] Got ${Object.keys(playerNames).length} player names`);

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
                    description: `Player ${playerName} has been excluded from this clan.`,
                    stats: null // Will be fetched after
                  });
                }
              }
            }
          }
        }

            // Stats will be fetched on-demand when user expands the clan
            console.log(`[Manual Check] Found ${leavers.length} leavers from [${clan.tag}] (stats will load on-demand)`);

        // Sort by timestamp (newest first)
        leavers.sort((a, b) => b.timestamp - a.timestamp);

        results.push({
          clan_id: clan.clan_id,
          clan_tag: clan.tag,
          clan_name: clan.name,
          leavers: leavers,
          count: leavers.length
        });

        totalLeavers += leavers.length;

        // Update clan status
        await updateClanStatus(clan.clan_id, {
          status: 'active',
          last_checked: new Date().toISOString(),
          last_member_count: leavers.length
        });

            clansChecked++;
            console.log(`[Manual Check] Completed ${clan.tag}: ${leavers.length} leavers`);
            sendProgress({
              type: 'clan_complete',
              message: `Completed [${clan.tag}]: ${leavers.length} leavers found`,
              clan_tag: clan.tag,
              leavers_count: leavers.length,
              current: clansChecked,
              total: enabledClans.length
            });

            // Add delay to respect rate limits (100ms between requests)
            await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`[Manual Check] Error checking clan ${clan.tag}:`, error);
        await updateClanStatus(clan.clan_id, {
          status: 'error',
          last_checked: new Date().toISOString()
        });
        results.push({
          clan_id: clan.clan_id,
          clan_tag: clan.tag,
          clan_name: clan.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          leavers: []
        });
          }
        }

        sendProgress({
          type: 'complete',
          success: true,
          message: 'Manual check completed',
          clans_checked: clansChecked,
          total_leavers: totalLeavers,
          results: results
        });

        controller.close();
      } catch (error) {
        console.error('[Manual Check] Top-level error:', error);
        sendProgress({
          type: 'error',
          message: 'Manual check failed',
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}