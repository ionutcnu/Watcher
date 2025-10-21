import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clanId = searchParams.get('clanId') || '500072271';

    // Generate the URL exactly as the main code does
    const now = new Date();
    const dateUntil = now.toISOString().split('.')[0] + '+00:00';
    const offset = Math.abs(now.getTimezoneOffset() * 60);

    const url = `https://eu.wargaming.net/clans/wot/${clanId}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;

    console.log('Debug: Testing URL:', url);

    // Try to fetch it
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return NextResponse.json({
      success: response.ok,
      status: status,
      generatedUrl: url,
      decodedDateUntil: dateUntil,
      offset: offset,
      timezone: now.getTimezoneOffset(),
      response: data
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
