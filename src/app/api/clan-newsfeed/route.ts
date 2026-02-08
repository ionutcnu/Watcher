import { NextRequest, NextResponse } from 'next/server';
import { badRequest, fail, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const clanId = new URL(request.url).searchParams.get('clanId');
    if (!clanId) return badRequest('clanId parameter is required');

    const now = new Date();
    const dateUntil = now.toISOString().split('.')[0] + '+00:00';
    const offset = Math.abs(now.getTimezoneOffset() * 60);

    const url = `https://eu.wargaming.net/clans/wot/${clanId}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return fail(`Request failed: ${response.status}`, response.status);
    }

    // Pass through raw Wargaming data (frontend parses .items directly)
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
