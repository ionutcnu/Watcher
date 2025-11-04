/**
 * Quick test script for scheduled monitoring
 * Run with: npx tsx scripts/test-scheduled.ts
 */

import { scheduledMonitoring } from '../src/scheduled';

// Mock D1 database - you'll need to provide real D1 instance
const mockDB = null; // Replace with actual DB from wrangler dev

const mockEvent = {
  scheduledTime: Date.now(),
  cron: '*/30 * * * *',
  waitUntil: (promise: Promise<unknown>) => {
    console.log('[Mock] waitUntil called');
  }
};

const mockCtx = {
  waitUntil: (promise: Promise<unknown>) => {
    console.log('[Mock] ExecutionContext.waitUntil called');
  },
  passThroughOnException: () => {
    console.log('[Mock] passThroughOnException called');
  }
};

const mockEnv = {
  DB: mockDB,
  WARGAMING_APPLICATION_ID: process.env.WARGAMING_APPLICATION_ID || '',
  WARGAMING_REALM: process.env.WARGAMING_REALM || 'eu',
  WARGAMING_API_BASE_URL: process.env.WARGAMING_API_BASE_URL || 'https://api.worldoftanks.eu'
};

async function test() {
  console.log('🧪 Testing Scheduled Monitoring\n');
  console.log('Mock Event:', mockEvent);
  console.log('Mock Env:', { ...mockEnv, DB: '...' });
  console.log('\n--- Starting Test ---\n');

  try {
    await scheduledMonitoring(mockEvent as any, mockEnv as any, mockCtx as any);
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  test();
}
