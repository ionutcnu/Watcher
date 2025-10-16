import { NextRequest, NextResponse } from 'next/server';
import { getWargamingAPI, apiKeyMissingResponse } from '@/lib/api-helpers';
import { addMonitoredClan } from '@/lib/monitoring-storage';
import { getDB } from '@/lib/cloudflare';

interface ImportResult {
  tag: string;
  success: boolean;
  error?: string;
  clan_id?: number;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body with explicit error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { clanTags } = body;

    if (!Array.isArray(clanTags) || clanTags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'clanTags must be a non-empty array' },
        { status: 400 }
      );
    }

    const db = getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { success: false, error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Validate API key exists
    if (!process.env.WARGAMING_APPLICATION_ID) {
      return NextResponse.json(
        { success: false, error: 'Wargaming API key not configured' },
        { status: 500 }
      );
    }

    const api = getWargamingAPI();
    if (!api) {
      return apiKeyMissingResponse();
    }
    const results: ImportResult[] = [];

    // Process each clan tag
    for (const tag of clanTags) {
      const trimmedTag = tag.trim();

      if (!trimmedTag) {
        results.push({
          tag,
          success: false,
          error: 'Empty clan tag'
        });
        continue;
      }

      try {
        // Search for the clan
        const searchResults = await api.searchClans(trimmedTag, 5);

        // Try to find exact match first (case-insensitive)
        let matchedClan = searchResults.find(
          (clan: { tag: string }) => clan.tag.toLowerCase() === trimmedTag.toLowerCase()
        );

        // If no exact match, take the first result if search term is contained
        if (!matchedClan && searchResults.length > 0) {
          matchedClan = searchResults[0];
        }

        if (!matchedClan) {
          results.push({
            tag: trimmedTag,
            success: false,
            error: 'Clan not found'
          });
          continue;
        }

        // Try to add to monitoring list
        try {
          await addMonitoredClan(db, {
            clan_id: matchedClan.clan_id,
            tag: matchedClan.tag,
            name: matchedClan.name,
            enabled: true
          });

          results.push({
            tag: trimmedTag,
            success: true,
            clan_id: matchedClan.clan_id,
            name: matchedClan.name
          });
        } catch (addError) {
          // Clan might already be monitored
          results.push({
            tag: trimmedTag,
            success: false,
            error: addError instanceof Error ? addError.message : 'Failed to add clan',
            clan_id: matchedClan.clan_id,
            name: matchedClan.name
          });
        }
      } catch (searchError) {
        results.push({
          tag: trimmedTag,
          success: false,
          error: searchError instanceof Error ? searchError.message : 'Search failed'
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
