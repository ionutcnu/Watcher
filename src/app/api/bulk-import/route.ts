import { NextRequest } from 'next/server';
import { addMonitoredClan } from '@/lib/monitoring-storage';
import { withDB, withAuth, withWargamingAPI } from '@/lib/api-guards';
import { ok, badRequest, fail } from '@/lib/api-response';

interface ImportResult {
  tag: string;
  success: boolean;
  error?: string;
  clan_id?: number;
  name?: string;
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  const userId = auth.user.id;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest('Invalid JSON in request body');
    }

    const { clanTags } = body;
    if (!Array.isArray(clanTags) || clanTags.length === 0) {
      return badRequest('clanTags must be a non-empty array');
    }

    // Enforce server-side limit to prevent DoS via excessive API calls
    const MAX_BULK_IMPORT = 50;
    if (clanTags.length > MAX_BULK_IMPORT) {
      return badRequest(`Cannot import more than ${MAX_BULK_IMPORT} clans at once`);
    }

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const apiResult = await withWargamingAPI();
    if (apiResult.error) return apiResult.error;
    const { api } = apiResult;

    const results: ImportResult[] = [];

    const maxOrderStmt = db
      .prepare('SELECT COALESCE(MAX(display_order), 0) as max_order FROM monitored_clans WHERE user_id = ?')
      .bind(userId);

    const maxOrderResult = await maxOrderStmt.first<{ max_order: number }>();
    let currentOrder = (maxOrderResult?.max_order || 0) + 1;

    for (const tag of clanTags) {
      const trimmedTag = tag.trim();

      if (!trimmedTag) {
        results.push({ tag, success: false, error: 'Empty clan tag' });
        continue;
      }

      try {
        const searchResults = await api.searchClans(trimmedTag, 5);

        let matchedClan = searchResults.find(
          (clan: { tag: string }) => clan.tag.toLowerCase() === trimmedTag.toLowerCase()
        );

        if (!matchedClan && searchResults.length > 0) {
          matchedClan = searchResults[0];
        }

        if (!matchedClan) {
          results.push({ tag: trimmedTag, success: false, error: 'Clan not found' });
          continue;
        }

        try {
          await addMonitoredClan(db, {
            clan_id: matchedClan.clan_id,
            tag: matchedClan.tag,
            name: matchedClan.name,
            enabled: true,
            display_order: currentOrder++,
            user_id: userId
          });

          results.push({
            tag: trimmedTag,
            success: true,
            clan_id: matchedClan.clan_id,
            name: matchedClan.name
          });
        } catch (addError) {
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

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return ok({ total: results.length, successful: successCount, failed: failureCount, results });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
