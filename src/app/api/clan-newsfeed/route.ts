import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clanId = searchParams.get('clanId');

    if (!clanId) {
      return NextResponse.json(
        { error: 'clanId parameter is required' },
        { status: 400 }
      );
    }

    // Build the URL correctly on the server side
    const now = new Date();
    const dateUntil = now.toISOString().split('.')[0] + '+00:00';
    const offset = Math.abs(now.getTimezoneOffset() * 60);

    // Construct URL with properly encoded date_until
    const url = `https://eu.wargaming.net/clans/wot/${clanId}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

    console.log('[Clan Newsfeed] Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      console.error(`[Clan Newsfeed] Failed: ${response.status}`);
      const errorText = await response.text();
      console.error('[Clan Newsfeed] Error response:', errorText);
      return NextResponse.json(
        { error: `Request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Clan Newsfeed] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
