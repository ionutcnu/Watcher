import { NextRequest, NextResponse } from 'next/server';
import { getMonitoredClans, addMonitoredClan, removeMonitoredClan, updateClanStatus } from '@/lib/monitoring-storage';
import { getDB } from '@/lib/cloudflare';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 error
    }

    const db = getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Get only user's clans
    const clans = await getMonitoredClans(db, authResult.user.id);
    return NextResponse.json({ success: true, clans });
  } catch (error) {
    console.error('Get monitored clans error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 error
    }

    const db = getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const { action, ...data } = await request.json();

    switch (action) {
      case 'add':
        // Add clan with user ownership
        await addMonitoredClan(db, { ...data, user_id: authResult.user.id });
        return NextResponse.json({ success: true, message: 'Clan added to monitoring list' });

      case 'remove':
        // Remove only if user owns the clan
        await removeMonitoredClan(db, data.clanId, authResult.user.id);
        return NextResponse.json({ success: true, message: 'Clan removed from monitoring list' });

      case 'update':
        // Update only if user owns the clan
        await updateClanStatus(db, data.clanId, data.updates, authResult.user.id);
        return NextResponse.json({ success: true, message: 'Clan status updated' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Monitored clans API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
