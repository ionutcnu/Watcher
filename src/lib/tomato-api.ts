export interface TomatoPlayerStats {
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

interface TomatoApiResponse {
  overall?: {
    battles?: number;
    tankcount?: number;
    tier?: number;
    wins?: number;
    losses?: number;
    totalDamage?: number;
    totalFrags?: number;
    totalSpotted?: number;
    totalSurvived?: number;
    wn8?: number;
    wnx?: number;
  };
  ratios?: {
    wn8?: number;
    rFRAG?: number;
    rDMG?: number;
    rSPT?: number;
    rDEF?: number;
    rWIN?: number;
  };
}

export async function fetchTomatoStats(
  region: string,
  accountId: number,
  days: number = 60
): Promise<TomatoPlayerStats | null> {
  try {
    const url = `https://api.tomato.gg/api/player/recents/${region}/${accountId}?cache=false&days=1,3,7,30,60&battles=1000,100`;

    console.log(`[Tomato API] Fetching stats for account ${accountId}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`[Tomato API] Failed to fetch stats for ${accountId}:`, response.status);
      return null;
    }

    const data = await response.json();

    // Find the 60 days data
    const stats60Days = data?.data?.[days] as TomatoApiResponse;

    if (!stats60Days?.overall) {
      console.log(`[Tomato API] No ${days} days data for account ${accountId}`);
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

export function formatNumber(num: number, decimals: number = 0): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(decimals);
}

export function getWN8Color(wn8: number): string {
  if (wn8 >= 2450) return 'text-purple-400'; // Super Unicum
  if (wn8 >= 2150) return 'text-blue-400';   // Unicum
  if (wn8 >= 1750) return 'text-cyan-400';   // Great
  if (wn8 >= 1400) return 'text-green-400';  // Good
  if (wn8 >= 1050) return 'text-yellow-400'; // Average
  if (wn8 >= 750) return 'text-orange-400';  // Below Average
  return 'text-red-400';                      // Bad
}
