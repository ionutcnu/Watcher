import { NextRequest, NextResponse } from 'next/server';
import { WargamingAPI } from '@/lib/wargaming-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    if (!search) {
      return NextResponse.json(
        { error: 'Search parameter is required' },
        { status: 400 }
      );
    }

    const api = new WargamingAPI();
    const clans = await api.searchClans(search, 10);

    return NextResponse.json({ clans });

  } catch (error) {
    console.error('Search clans error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}