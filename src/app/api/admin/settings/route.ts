import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getDB, getCloudflareEnvSync } from '@/lib/cloudflare';

// Admin check
function isAdmin(userEmail: string): boolean {
  const env = getCloudflareEnvSync();
  const adminEmails = env?.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  return adminEmails.includes(userEmail);
}

// Get settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!isAdmin(authResult.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get signup_enabled setting
    const config = await db
      .prepare('SELECT signup_enabled FROM monitoring_config WHERE id = 1')
      .first<{ signup_enabled: number }>();

    return NextResponse.json({
      success: true,
      settings: {
        signupEnabled: config?.signup_enabled === 1,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update settings
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!isAdmin(authResult.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { signupEnabled } = await request.json();

    const db = await getDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Update signup_enabled setting
    await db
      .prepare('UPDATE monitoring_config SET signup_enabled = ? WHERE id = 1')
      .bind(signupEnabled ? 1 : 0)
      .run();

    return NextResponse.json({
      success: true,
      message: `Sign-up ${signupEnabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
