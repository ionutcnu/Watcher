import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/cloudflare';

// Check if sign-up is enabled
export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    if (!db) {
      return NextResponse.json(
        { enabled: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check monitoring_config for signup_enabled flag
    const config = await db
      .prepare('SELECT signup_enabled FROM monitoring_config WHERE id = 1')
      .first<{ signup_enabled: number }>();

    const enabled = config?.signup_enabled === 1;

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Signup check error:', error);
    return NextResponse.json(
      { enabled: false, error: 'Failed to check signup status' },
      { status: 500 }
    );
  }
}
