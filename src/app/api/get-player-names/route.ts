import { NextRequest, NextResponse } from 'next/server';
import { getWargamingAPI, apiKeyMissingResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { accountIds } = await request.json();
    
    if (!accountIds || !Array.isArray(accountIds)) {
      return NextResponse.json(
        { error: 'Account IDs array is required' },
        { status: 400 }
      );
    }

    const api = await getWargamingAPI();
    if (!api) {
      return apiKeyMissingResponse();
    }
    const playerNames = await api.getPlayerNames(accountIds);

    return NextResponse.json({ 
      success: true,
      playerNames
    });

  } catch (error) {
    console.error('Get player names error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}