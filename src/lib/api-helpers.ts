import { NextResponse } from 'next/server';
import { WargamingAPI } from './wargaming-api';
import { getCloudflareEnv } from './cloudflare';

export function getWargamingAPI(): WargamingAPI | null {
  // Try Cloudflare env first, then fall back to process.env (for local dev)
  const env = getCloudflareEnv();
  const apiKey = env?.WARGAMING_APPLICATION_ID || process.env.WARGAMING_APPLICATION_ID;

  if (!apiKey) {
    console.error('WARGAMING_APPLICATION_ID is not set');
    return null;
  }
  return new WargamingAPI(apiKey);
}

export function apiKeyMissingResponse() {
  return NextResponse.json(
    { error: 'API configuration error' },
    { status: 500 }
  );
}
