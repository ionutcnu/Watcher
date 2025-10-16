import { NextRequest, NextResponse } from 'next/server';
import { getWargamingAPI, apiKeyMissingResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clanId = searchParams.get('clanId');
    const realm = searchParams.get('realm') || 'eu';
    
    if (!clanId) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    const api = getWargamingAPI();
    if (!api) {
      return apiKeyMissingResponse();
    }
    const rawData = await api.getClanNewsfeed(parseInt(clanId), realm);

    // Parse the events based on the actual API structure
    const events = [];
    if (rawData?.results && Array.isArray(rawData.results)) {
      for (const item of rawData.results) {
        // Each item has a collection of events
        if (item.collection && Array.isArray(item.collection)) {
          for (const event of item.collection) {
            const eventData = event._meta_;
            const timestamp = new Date(eventData.created_at).getTime() / 1000;
            
            // Determine event type and player info
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
                player: {
                  account_id: accountId,
                  account_name: playerName
                },
                timestamp: timestamp,
                date: new Date(timestamp * 1000).toISOString().split('T')[0],
                time: new Date(timestamp * 1000).toLocaleString(),
                role: role,
                group: eventData.group || 'Military Personnel',
                description: description,
                initiator: eventData.initiator_id
              });
            }
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ 
      success: true,
      events: events,
      total: events.length
    });

  } catch (error) {
    console.error('Get clan history error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}