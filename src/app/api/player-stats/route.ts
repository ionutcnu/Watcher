import { NextRequest, NextResponse } from 'next/server';

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

async function fetchTomatoStats(
  region: string,
  accountId: number,
  days: number = 60
): Promise<TomatoPlayerStats | null> {
  try {
    const url = `https://api.tomato.gg/dev/api-v2/player/recents/${region}/${accountId}?cache=false&days=1,3,7,30,60&battles=1000,100`;

    console.log(`[Tomato] Fetching stats for ${accountId}`);

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

    // The structure is data.data.days[60]
    const stats60Days = data?.data?.days?.[days];

    if (!stats60Days?.overall) {
      console.log(`[Tomato] No 60-day stats found for ${accountId}`);
      return null;
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIds, region = 'eu' } = body;

    if (!accountIds || !Array.isArray(accountIds)) {
      return NextResponse.json(
        { success: false, error: 'accountIds array is required' },
        { status: 400 }
      );
    }

    console.log(`[Player Stats API] Fetching stats for ${accountIds.length} players`);

    // Process in batches of 3 with delays
    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 1000;
    const TIMEOUT_MS = 15000;

    const results: Record<number, TomatoPlayerStats | null> = {};

    for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
      const batch = accountIds.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (accountId: number, batchIndex: number) => {
        // Stagger requests within batch
        await new Promise(resolve => setTimeout(resolve, batchIndex * 200));

        try {
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), TIMEOUT_MS)
          );

          const statsPromise = fetchTomatoStats(region, accountId, 60);
          let stats = await Promise.race([statsPromise, timeoutPromise]);

          // Retry once if timeout
          if (!stats) {
            console.log(`[Player Stats API] Retrying ${accountId}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retryTimeoutPromise = new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), TIMEOUT_MS)
            );
            const retryStatsPromise = fetchTomatoStats(region, accountId, 60);
            stats = await Promise.race([retryStatsPromise, retryTimeoutPromise]);
          }

          results[accountId] = stats;
        } catch (error) {
          console.error(`[Player Stats API] Error for ${accountId}:`, error);
          results[accountId] = null;
        }
      });

      await Promise.all(batchPromises);

      // Delay between batches
      if (i + BATCH_SIZE < accountIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    const successCount = Object.values(results).filter(s => s !== null).length;
    console.log(`[Player Stats API] Complete: ${successCount}/${accountIds.length} successful`);

    return NextResponse.json({
      success: true,
      stats: results
    });

  } catch (error) {
    console.error('[Player Stats API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
