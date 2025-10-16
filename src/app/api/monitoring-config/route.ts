import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringConfig, saveMonitoringConfig } from '@/lib/monitoring-storage';
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

    const config = await getMonitoringConfig(db);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Get monitoring config error:', error);
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

    const config = await request.json();
    await saveMonitoringConfig(db, config);
    return NextResponse.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Save monitoring config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
