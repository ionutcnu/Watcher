import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/cloudflare';
import { requireAuth } from '@/lib/auth-middleware';
import { runClanMonitoring, MonitoringProgress } from '@/lib/monitoring-service';

type ProgressData = MonitoringProgress;

export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Return 401 error
  }

  const userId = authResult.user.id;
  const encoder = new TextEncoder();

  // Parse request body to get batch parameters
  let batchStart = 0;
  let batchSize = 20; // Process 20 clans per batch to stay within Cloudflare limits

  try {
    const body = await request.json();
    if (body.batchStart !== undefined) batchStart = body.batchStart;
    if (body.batchSize !== undefined) batchSize = body.batchSize;
  } catch {
    // No body or invalid JSON - use defaults
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send progress updates
      const sendProgress = (data: ProgressData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const db = await getDB();
        if (!db) {
          console.error('[Manual Check] D1 database binding not found');
          sendProgress({
            type: 'error',
            message: 'Database configuration error',
            success: false,
            error: 'Database configuration error'
          });
          controller.close();
          return;
        }

        // Use the monitoring service to perform the check
        await runClanMonitoring(db, {
          userId,
          batchStart,
          batchSize,
          onProgress: sendProgress
        });

        controller.close();
      } catch (error) {
        console.error('[Manual Check] Top-level error:', error);
        sendProgress({
          type: 'error',
          message: 'Manual check failed',
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}