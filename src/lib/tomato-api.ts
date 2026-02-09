import type { TomatoPlayerStats } from '@/types/player-stats';
export type { TomatoPlayerStats };

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
    // Tomato API supports: 1, 3, 7, 30, 60, 1000 days
    // Request all available ranges, then extract the specific one
    const url = `https://api.tomato.gg/api/player/recents/${region}/${accountId}?cache=false&days=1,3,7,30,60,1000&battles=1000,100`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    console.log(`[TomatoAPI] Fetching ${days} days for account ${accountId}`);
    console.log(`[TomatoAPI] Available days:`, Object.keys(data?.data?.days || {}));

    // Structure is data.data.days[60], not data.data[60]
    const stats60Days = data?.data?.days?.[days] as TomatoApiResponse;

    if (!stats60Days?.overall) {
      console.warn(`[TomatoAPI] No data for ${days} days, available:`, Object.keys(data?.data?.days || {}));
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
  } catch {
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

/** @deprecated Use getWN8Color from '@/lib/wn8-colors' instead */
export { getWN8Color } from './wn8-colors';

export interface TomatoClanStats {
  clan_id: number;
  tag: string;
  name: string;
  members_count: number;
  avg_wn8: number;
  avg_winrate: number;
  avg_battles: number; // Average battles (per member)
  avg_tier: number;
  clan_rating: number | null; // Tomato.gg's clan rating
  avg_damage?: number; // Average damage per battle (added separately from WG API)
}

interface TomatoClanMember {
  account_id: number;
  account_name: string;
  recentWN8?: number;
  recentWinrate?: number;
  recentBattles?: number;
  recentAvgtier?: number;
  recentDamage?: number; // Total damage in recent period
  recentAvgDmg?: number; // Average damage per battle
}

/**
 * Fetches clan statistics from Tomato.gg by parsing the clan stats page.
 * Extracts member stats from __NEXT_DATA__ and calculates averages.
 */
export async function fetchTomatoClanStats(
  region: string,
  clanId: number,
  clanTag: string
): Promise<TomatoClanStats | null> {
  try {
    // URL encode the clan tag to handle special characters
    const encodedTag = encodeURIComponent(clanTag);
    const url = `https://tomato.gg/clan-stats/${encodedTag}-${clanId}/${region.toUpperCase()}`;

    console.log(`[Tomato API] Fetching clan stats: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });

    if (!response.ok) {
      console.error(`[Tomato API] HTTP ${response.status} for clan ${clanTag} (${clanId})`);
      return null;
    }

    const html = await response.text();

    // Extract Clan Rating from HTML (it's rendered, not in __NEXT_DATA__)
    let clanRating: number | null = null;
    const ratingMatch = html.match(/>Clan Rating<\/div><div[^>]*>(\d+)<\/div>/);
    if (ratingMatch) {
      clanRating = parseInt(ratingMatch[1], 10);
    }

    // Extract __NEXT_DATA__ JSON from HTML
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) {
      console.error(`[Tomato API] No __NEXT_DATA__ found for clan ${clanTag} (${clanId})`);
      return null;
    }

    const nextData = JSON.parse(match[1]);
    const clanData = nextData?.props?.pageProps?.clanData;

    if (!clanData?.members || !Array.isArray(clanData.members)) {
      console.error(`[Tomato API] Invalid clan data structure for ${clanTag} (${clanId})`);
      return null;
    }

    const members = clanData.members as TomatoClanMember[];

    // Filter out members with no recent battles
    const activeMembers = members.filter((m: TomatoClanMember) =>
      m.recentBattles && m.recentBattles > 0
    );

    if (activeMembers.length === 0) {
      console.warn(`[Tomato API] No active members for clan ${clanTag} (${clanId})`);
      return null;
    }

    console.log(`[Tomato API] Successfully fetched stats for ${clanTag}: ${activeMembers.length} active members`);

    // Calculate averages from recent stats (last 60 days)
    const totalWN8 = activeMembers.reduce((sum: number, m: TomatoClanMember) => sum + (m.recentWN8 || 0), 0);
    const totalWinrate = activeMembers.reduce((sum: number, m: TomatoClanMember) => sum + (m.recentWinrate || 0), 0);
    const totalBattles = activeMembers.reduce((sum: number, m: TomatoClanMember) => sum + (m.recentBattles || 0), 0);
    const totalTier = activeMembers.reduce((sum: number, m: TomatoClanMember) => sum + (m.recentAvgtier || 0), 0);

    console.log(`[Tomato API] Clan ${clanTag} rating extracted from HTML: ${clanRating}`);

    return {
      clan_id: clanData.clan_id,
      tag: clanData.tag,
      name: clanData.name || clanData.tag,
      members_count: clanData.members_count,
      avg_wn8: Math.round(totalWN8 / activeMembers.length),
      avg_winrate: parseFloat((totalWinrate / activeMembers.length).toFixed(2)),
      avg_battles: Math.round(totalBattles / activeMembers.length),
      avg_tier: parseFloat((totalTier / activeMembers.length).toFixed(2)),
      clan_rating: clanRating,
    };
  } catch (error) {
    console.error('Failed to fetch Tomato clan stats:', error);
    return null;
  }
}
