import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringConfig, saveMonitoringConfig } from '@/lib/monitoring-storage';

export async function GET() {
  try {
    const config = await getMonitoringConfig();
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
    const config = await request.json();
    await saveMonitoringConfig(config);
    return NextResponse.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Save monitoring config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}