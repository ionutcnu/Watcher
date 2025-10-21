import { NextRequest, NextResponse } from 'next/server';
import { getWargamingAPI, apiKeyMissingResponse } from '@/lib/api-helpers';
import { getLatestSnapshot, saveSnapshot, saveChanges } from '@/lib/storage';
import { detectChanges, createSnapshot } from '@/lib/change-detector';
import { getDB } from '@/lib/cloudflare';

export async function POST(request: NextRequest) {
  try {
    const { clanId } = await request.json();

    if (!clanId) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    const db = await getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const api = await getWargamingAPI();
    if (!api) {
      return apiKeyMissingResponse();
    }

    // Fetch current clan info
    const currentClan = await api.getClanInfo(clanId);
    if (!currentClan) {
      return NextResponse.json(
        { error: 'Clan not found' },
        { status: 404 }
      );
    }

    // Get previous snapshot
    const previousSnapshot = await getLatestSnapshot(db, clanId);

    // Detect changes
    const changes = detectChanges(previousSnapshot, currentClan);

    // Save new snapshot
    const newSnapshot = createSnapshot(currentClan);
    await saveSnapshot(db, newSnapshot);

    // Save changes if any
    if (changes.length > 0) {
      await saveChanges(db, changes);
    }

    return NextResponse.json({
      success: true,
      clan: currentClan,
      changes,
      summary: {
        total_members: currentClan.members.length,
        joins: changes.filter(c => c.type === 'join').length,
        leaves: changes.filter(c => c.type === 'leave').length
      }
    });

  } catch (error) {
    console.error('Scan clan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}