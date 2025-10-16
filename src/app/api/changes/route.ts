import { NextRequest, NextResponse } from 'next/server';
import { getRecentChanges } from '@/lib/storage';
import { getDB } from '@/lib/cloudflare';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const db = getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const changes = await getRecentChanges(db, days);

    return NextResponse.json({ changes });

  } catch (error) {
    console.error('Get changes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}