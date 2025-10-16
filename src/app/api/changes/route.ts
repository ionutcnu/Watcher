import { NextRequest, NextResponse } from 'next/server';
import { getRecentChanges } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const changes = await getRecentChanges(days);

    return NextResponse.json({ changes });

  } catch (error) {
    console.error('Get changes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}