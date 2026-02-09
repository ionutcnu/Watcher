import { NextRequest } from 'next/server';
import { fetchTomatoStats, type TomatoPlayerStats } from '@/lib/tomato-api';
import { withAuth } from '@/lib/api-guards';
import { ok, badRequest, serverError } from '@/lib/api-response';

const ALLOWED_REGIONS = ['eu', 'na', 'asia', 'ru'];
const MAX_ACCOUNT_IDS = 100;

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const { accountIds, region = 'eu', days = 60 } = await request.json();

    if (!accountIds || !Array.isArray(accountIds)) {
      return badRequest('accountIds array is required');
    }

    if (accountIds.length > MAX_ACCOUNT_IDS) {
      return badRequest(`Cannot fetch stats for more than ${MAX_ACCOUNT_IDS} accounts at once`);
    }

    if (!ALLOWED_REGIONS.includes(region)) {
      return badRequest(`Invalid region. Allowed: ${ALLOWED_REGIONS.join(', ')}`);
    }

    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 1000;
    const TIMEOUT_MS = 15000;

    const results: Record<number, TomatoPlayerStats | null> = {};

    for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
      const batch = accountIds.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (accountId: number, batchIndex: number) => {
        await new Promise(resolve => setTimeout(resolve, batchIndex * 200));

        try {
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), TIMEOUT_MS)
          );

          let stats = await Promise.race([fetchTomatoStats(region, accountId, days), timeoutPromise]);

          if (!stats) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryTimeout = new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), TIMEOUT_MS)
            );
            stats = await Promise.race([fetchTomatoStats(region, accountId, days), retryTimeout]);
          }

          results[accountId] = stats;
        } catch {
          results[accountId] = null;
        }
      });

      await Promise.all(batchPromises);

      if (i + BATCH_SIZE < accountIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    return ok({ stats: results });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal server error');
  }
}
