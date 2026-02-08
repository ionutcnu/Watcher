import { NextRequest } from 'next/server';
import { withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const clanId = params.get('clanId');
    const realm = params.get('realm') || 'eu';

    if (!clanId) return badRequest('Clan ID is required');

    const { api, error } = await withWargamingAPI();
    if (error) return error;

    const rawData = await api.getClanNewsfeed(parseInt(clanId), realm);

    // Parse events from the actual API structure
    const events: Array<{
      type: string;
      subtype: string;
      player: { account_id: number | null; account_name: string };
      timestamp: number;
      date: string;
      time: string;
      role: string;
      group: string;
      description: string;
      initiator: unknown;
    }> = [];

    if (rawData?.results && Array.isArray(rawData.results)) {
      for (const item of rawData.results) {
        if (item.collection && Array.isArray(item.collection)) {
          for (const event of item.collection) {
            const eventData = event._meta_;
            const timestamp = new Date(eventData.created_at).getTime() / 1000;

            let eventType = 'unknown';
            let playerName = '';
            let accountId = null;
            let role = '';
            let description = '';

            if (eventData.subtype === 'join_clan') {
              eventType = 'join';
              playerName = eventData.accounts_info?.[0]?.name || 'Unknown';
              accountId = eventData.accounts_info?.[0]?.id;
              description = `Player ${playerName} has been accepted to the clan.`;
            } else if (eventData.subtype === 'leave_clan') {
              eventType = 'leave';
              playerName = eventData.accounts_info?.[0]?.name || 'Unknown';
              accountId = eventData.accounts_info?.[0]?.id;
              description = `Player ${playerName} has been excluded from this clan.`;
            } else if (eventData.subtype === 'change_role') {
              eventType = 'role_change';
              playerName = eventData.accounts_info?.[0]?.name || 'Unknown';
              accountId = eventData.accounts_info?.[0]?.id;
              role = eventData.group || '';
              description = `Player ${playerName} has been assigned to a new clan position: ${role}`;
            }

            if (playerName && eventType !== 'unknown') {
              events.push({
                type: eventType,
                subtype: eventData.subtype,
                player: { account_id: accountId, account_name: playerName },
                timestamp,
                date: new Date(timestamp * 1000).toISOString().split('T')[0],
                time: new Date(timestamp * 1000).toLocaleString(),
                role,
                group: eventData.group || 'Military Personnel',
                description,
                initiator: eventData.initiator_id
              });
            }
          }
        }
      }
    }

    events.sort((a, b) => b.timestamp - a.timestamp);

    return ok({ events, total: events.length });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
