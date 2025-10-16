import { NextRequest, NextResponse } from 'next/server';
import { WargamingAPI } from '@/lib/wargaming-api';
import { getLatestSnapshot, saveSnapshot, saveChanges } from '@/lib/storage';
import { detectChanges, createSnapshot } from '@/lib/change-detector';

export async function POST(request: NextRequest) {
  try {
    const { clanId } = await request.json();
    
    if (!clanId) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    const api = new WargamingAPI();
    
    // Fetch current clan info
    const currentClan = await api.getClanInfo(clanId);
    if (!currentClan) {
      return NextResponse.json(
        { error: 'Clan not found' },
        { status: 404 }
      );
    }

    // Get previous snapshot
    const previousSnapshot = await getLatestSnapshot(clanId);
    
    // Detect changes
    const changes = detectChanges(previousSnapshot, currentClan);
    
    // Save new snapshot
    const newSnapshot = createSnapshot(currentClan);
    await saveSnapshot(newSnapshot);
    
    // Save changes if any
    if (changes.length > 0) {
      await saveChanges(changes);
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