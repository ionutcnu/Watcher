import { ClanInfo, ClanMember } from '@/types/clan';

const BASE_URL = process.env.WARGAMING_API_BASE_URL || 'https://api.worldoftanks.eu';

interface ApiMemberResponse {
  account_id: number;
  account_name: string;
  joined_at: number;
  role: string;
}

interface ApiClanSearchResponse {
  clan_id: number;
  tag: string;
  name: string;
}

interface ApiClanHistoryEntry {
  clan_id: number;
  clan_tag: string;
  clan_name: string;
  joined_at: number;
  left_at: number | null;
  role: string;
}

interface ApiPlayerDataResponse {
  nickname: string;
}

interface ClanNewsfeedResponse {
  items?: Array<{
    subtype?: string;
    accounts_ids?: number[];
    created_at?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export class WargamingAPI {
  private applicationId: string;

  constructor(applicationId?: string) {
    this.applicationId = applicationId || process.env.WARGAMING_APPLICATION_ID || '';
    if (!this.applicationId) {
      throw new Error('WARGAMING_APPLICATION_ID is required');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, string | number> = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('application_id', this.applicationId);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.data;
  }

  async getClanInfo(clanId: number): Promise<ClanInfo | null> {
    const data = await this.makeRequest('/wgn/clans/info/', { clan_id: clanId });

    const clanData = data[clanId.toString()];
    if (!clanData) return null;

    return {
      clan_id: clanId,
      tag: clanData.tag,
      name: clanData.name,
      members: (clanData.members || []).map((member: ApiMemberResponse): ClanMember => ({
        account_id: member.account_id,
        account_name: member.account_name,
        joined_at: member.joined_at,
        role: member.role
      }))
    };
  }

  async searchClans(search: string, limit: number = 10): Promise<Array<{ clan_id: number; tag: string; name: string }>> {
    const data = await this.makeRequest('/wgn/clans/list/', { search, limit });

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((clan: ApiClanSearchResponse) => ({
      clan_id: clan.clan_id,
      tag: clan.tag,
      name: clan.name
    }));
  }

  async getPlayerClanHistory(accountId: number): Promise<Array<{
    clan_id: number;
    clan_tag: string;
    clan_name: string;
    joined_at: number;
    left_at: number | null;
    role: string;
  }>> {
    const data = await this.makeRequest('/wot/clans/memberhistory/', { account_id: accountId });

    return data.map((entry: ApiClanHistoryEntry) => ({
      clan_id: entry.clan_id,
      clan_tag: entry.clan_tag,
      clan_name: entry.clan_name,
      joined_at: entry.joined_at,
      left_at: entry.left_at,
      role: entry.role
    }));
  }

  async getClanNewsfeed(clanId: number, realm: string = 'eu'): Promise<ClanNewsfeedResponse> {
    const now = new Date();
    const dateUntil = now.toISOString().split('.')[0] + '+00:00';
    const offset = Math.abs(now.getTimezoneOffset() * 60);

    const url = `https://${realm}.wargaming.net/clans/wot/${clanId}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://${realm}.wargaming.net/clans/wot/${clanId}/`,
      }
    });

    if (!response.ok) {
      throw new Error(`Newsfeed request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getClanPageInfo(clanId: number, realm: string = 'eu'): Promise<{ avg_damage: number | null; rating: number | null }> {
    const url = `https://${realm}.wargaming.net/clans/wot/${clanId}/api/claninfo/`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://${realm}.wargaming.net/clans/wot/${clanId}/`,
      }
    });

    if (!response.ok) {
      throw new Error(`Clan page info request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse average damage and rating from response
    const avgDamage = data?.clanview?.rating?.average_damage_per_battle;
    const rating = data?.clanview?.rating?.rating;

    return {
      avg_damage: avgDamage != null && !isNaN(avgDamage) ? Math.round(avgDamage) : null,
      rating: rating != null && !isNaN(rating) ? Math.round(rating) : null
    };
  }

  async getClanRatings(clanIds: number[]): Promise<Record<number, number | null>> {
    if (clanIds.length === 0) return {};
    try {
      const data = await this.makeRequest('/wot/clanratings/clans/', {
        clan_id: clanIds.join(','),
      });
      const result: Record<number, number | null> = {};
      for (const id of clanIds) {
        const entry = data?.[id.toString()];
        const rating = entry?.global_rating_weighted_avg;
        // Ensure we never return NaN - convert to null
        result[id] = (rating != null && !isNaN(rating)) ? rating : null;
      }
      return result;
    } catch {
      return {};
    }
  }

  async getPlayerNames(accountIds: number[]): Promise<Record<number, string>> {
    try {
      const data = await this.makeRequest('/wgn/account/info/', {
        account_id: accountIds.join(','),
        fields: 'nickname'
      });

      const playerNames: Record<number, string> = {};
      for (const [accountId, playerData] of Object.entries(data)) {
        if (playerData && typeof playerData === 'object' && 'nickname' in playerData) {
          playerNames[parseInt(accountId)] = (playerData as ApiPlayerDataResponse).nickname;
        }
      }

      return playerNames;
    } catch {
      return {};
    }
  }

  async getClanMembersStats(accountIds: number[]): Promise<Record<number, { avg_damage: number; battles: number } | null>> {
    if (accountIds.length === 0) return {};
    try {
      // Batch requests in groups of 100 (API limit)
      const result: Record<number, { avg_damage: number; battles: number } | null> = {};

      for (let i = 0; i < accountIds.length; i += 100) {
        const batch = accountIds.slice(i, i + 100);
        const data = await this.makeRequest('/wot/account/info/', {
          account_id: batch.join(','),
          fields: 'statistics.all.battles,statistics.all.damage_dealt'
        });

        for (const id of batch) {
          const accountData = data?.[id.toString()];
          const battles = accountData?.statistics?.all?.battles;
          const totalDamage = accountData?.statistics?.all?.damage_dealt;

          if (battles && battles > 0 && totalDamage != null) {
            result[id] = {
              avg_damage: Math.round(totalDamage / battles),
              battles: battles
            };
          } else {
            result[id] = null;
          }
        }
      }

      return result;
    } catch {
      return {};
    }
  }
}
