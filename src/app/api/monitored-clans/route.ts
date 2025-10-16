import { NextRequest, NextResponse } from 'next/server';
import { getMonitoredClans, addMonitoredClan, removeMonitoredClan, updateClanStatus } from '@/lib/monitoring-storage';
import { getDB } from '@/lib/cloudflare';

export async function GET() {
  try {
    const db = getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const clans = await getMonitoredClans(db);
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
        await addMonitoredClan(db, data);
        return NextResponse.json({ success: true, message: 'Clan added to monitoring list' });

      case 'remove':
        await removeMonitoredClan(db, data.clanId);
        return NextResponse.json({ success: true, message: 'Clan removed from monitoring list' });

      case 'update':
        await updateClanStatus(db, data.clanId, data.updates);
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
