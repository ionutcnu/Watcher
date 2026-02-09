import { NextRequest } from 'next/server';
import { getMonitoredClans, updateClanStatus } from '@/lib/monitoring-storage';
import { withDB, withAuth, withWargamingAPI } from '@/lib/api-guards';
import type { TomatoPlayerStats } from '@/lib/tomato-api';

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
  hasMore?: boolean;
  nextBatchStart?: number;
  results?: Array<{
    clan_id: number;
    clan_tag: string;
    clan_name: string;
    error?: string;
    leavers?: unknown[];
    joiners?: unknown[];
    count?: number;
  }>;
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  const userId = auth.user.id;
  const encoder = new TextEncoder();

  let batchStart = 0;
  let batchSize = 20;

  try {
    const body = await request.json();
    if (body.batchStart !== undefined) batchStart = body.batchStart;
    if (body.batchSize !== undefined) batchSize = body.batchSize;
  } catch {
    // No body or invalid JSON - use defaults
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: ProgressData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendProgress({ type: 'start', message: 'Starting manual check...' });

        const dbResult = await withDB();
        if (dbResult.error) {
          sendProgress({ type: 'error', message: 'Database configuration error', success: false, error: 'Database configuration error' });
          controller.close();
          return;
        }
        const { db } = dbResult;

        const monitoredClans = await getMonitoredClans(db, userId);
        const enabledClans = monitoredClans.filter(clan => clan.enabled);

        enabledClans.sort((a, b) => {
          if (a.display_order === undefined && b.display_order === undefined) return 0;
          if (a.display_order === undefined) return 1;
          if (b.display_order === undefined) return -1;
          return a.display_order - b.display_order;
        });

        if (enabledClans.length === 0) {
          sendProgress({
            type: 'complete', message: 'No enabled clans to monitor',
            success: false, error: 'No enabled clans to monitor',
            total: 0, clans_checked: 0, total_leavers: 0, results: []
          });
          controller.close();
          return;
        }

        const batchEnd = Math.min(batchStart + batchSize, enabledClans.length);
        const batchClans = enabledClans.slice(batchStart, batchEnd);
        const totalClans = enabledClans.length;
        const hasMore = batchEnd < totalClans;

        sendProgress({
          type: 'info',
          message: `Processing clans ${batchStart + 1}-${batchEnd} of ${totalClans}...`,
          total: totalClans
        });

        const allResults = [];
        let totalLeavers = 0;
        let totalClansChecked = 0;

        for (const clan of batchClans) {
          try {
            sendProgress({
              type: 'clan_start',
              message: `Checking clan [${clan.tag}] ${clan.name} (${batchStart + totalClansChecked + 1}/${totalClans})`,
              current: batchStart + totalClansChecked + 1,
              total: totalClans
            });

            const now = new Date();
            const dateUntil = now.toISOString().split('.')[0] + '+00:00';
            const offset = Math.abs(now.getTimezoneOffset() * 60);
            const url = `https://eu.wargaming.net/clans/wot/${clan.clan_id}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
              }
            });

            if (!response.ok) {
              await updateClanStatus(db, clan.clan_id, {
                status: 'error', last_checked: new Date().toISOString()
              }, userId);
              allResults.push({
                clan_id: clan.clan_id, clan_tag: clan.tag, clan_name: clan.name,
                error: `Failed to fetch clan history (${response.status})`, leavers: []
              });
              totalClansChecked++;
              continue;
            }

            const rawData = await response.json();

            const leavers: Array<{
              player: { account_id: number; account_name: string };
              timestamp: number;
              date: string;
              time: string;
              description: string;
              stats: TomatoPlayerStats | null;
            }> = [];
            const joiners: Array<{
              player: { account_id: number; account_name: string };
              timestamp: number;
              date: string;
              time: string;
              description: string;
              stats: TomatoPlayerStats | null;
            }> = [];
            const allAccountIds = new Set<number>();

            if (rawData?.items && Array.isArray(rawData.items)) {
              for (const item of rawData.items) {
                if ((item.subtype === 'leave_clan' || item.subtype === 'join_clan') && item.accounts_ids) {
                  item.accounts_ids.forEach((id: number) => {
                    allAccountIds.add(id);
                  });
                }
              }

              if (allAccountIds.size > 0) {
                const apiResult = await withWargamingAPI();
                let playerNames: Record<number, string> = {};
                if (!apiResult.error) {
                  playerNames = await apiResult.api.getPlayerNames(Array.from(allAccountIds));
                }

                for (const item of rawData.items) {
                  const timestamp = new Date(item.created_at).getTime() / 1000;

                  if (item.subtype === 'leave_clan' && item.accounts_ids) {
                    for (const accountId of item.accounts_ids) {
                      const playerName = playerNames[accountId] || `Player_${accountId}`;
                      leavers.push({
                        player: { account_id: accountId, account_name: playerName },
                        timestamp,
                        date: new Date(timestamp * 1000).toISOString().split('T')[0],
                        time: new Date(timestamp * 1000).toLocaleString(),
                        description: `Player ${playerName} has been excluded from this clan.`,
                        stats: null
                      });
                    }
                  } else if (item.subtype === 'join_clan' && item.accounts_ids) {
                    for (const accountId of item.accounts_ids) {
                      const playerName = playerNames[accountId] || `Player_${accountId}`;
                      joiners.push({
                        player: { account_id: accountId, account_name: playerName },
                        timestamp,
                        date: new Date(timestamp * 1000).toISOString().split('T')[0],
                        time: new Date(timestamp * 1000).toLocaleString(),
                        description: `Player ${playerName} has joined this clan.`,
                        stats: null
                      });
                    }
                  }
                }
              }
            }

            leavers.sort((a, b) => b.timestamp - a.timestamp);
            joiners.sort((a, b) => b.timestamp - a.timestamp);

            allResults.push({
              clan_id: clan.clan_id, clan_tag: clan.tag, clan_name: clan.name,
              leavers, joiners, count: leavers.length
            });
            totalLeavers += leavers.length;

            // Update last_checked but don't modify last_member_count here (newsfeed doesn't provide current member count)
            await updateClanStatus(db, clan.clan_id, {
              status: 'active', last_checked: new Date().toISOString()
            }, userId);

            totalClansChecked++;
            sendProgress({
              type: 'clan_complete',
              message: `Completed [${clan.tag}]: ${leavers.length} leavers found (${batchStart + totalClansChecked}/${totalClans})`,
              clan_tag: clan.tag, leavers_count: leavers.length,
              current: batchStart + totalClansChecked, total: totalClans
            });

            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            await updateClanStatus(db, clan.clan_id, {
              status: 'error', last_checked: new Date().toISOString()
            }, userId);
            allResults.push({
              clan_id: clan.clan_id, clan_tag: clan.tag, clan_name: clan.name,
              error: error instanceof Error ? error.message : 'Unknown error', leavers: []
            });
            totalClansChecked++;
          }
        }

        const progressMessage = hasMore
          ? `Batch complete: ${totalClansChecked} clans checked (${batchStart + 1}-${batchEnd} of ${totalClans}). Processing next batch...`
          : `Manual check complete: ${batchEnd} clans checked, ${totalLeavers} total leavers found.`;

        sendProgress({
          type: hasMore ? 'batch_complete' : 'complete',
          success: true, message: progressMessage,
          clans_checked: totalClansChecked, total_leavers: totalLeavers,
          results: allResults, total: totalClans, current: batchEnd,
          hasMore, nextBatchStart: hasMore ? batchEnd : undefined
        });

        controller.close();
      } catch (error) {
        sendProgress({
          type: 'error', message: 'Manual check failed',
          success: false, error: error instanceof Error ? error.message : 'Internal server error'
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
