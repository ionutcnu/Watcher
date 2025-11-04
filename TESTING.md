# Testing Guide for Automated Monitoring

This guide walks you through testing the automated monitoring implementation locally and in production.

---

## Prerequisites

Before testing, ensure you have:
- [x] Wargaming API key set in secrets
- [x] Cloudflare D1 database created and migrated
- [x] At least one user account created
- [x] At least one clan added and enabled for monitoring
- [x] (Optional) Discord webhook URL for notification testing

---

## Step 1: Build the Project

First, build the worker with the new scheduled handler:

```bash
npm run build:worker
```

**Expected output:**
```
> opennextjs-cloudflare build && node scripts/add-scheduled-handler.mjs

✓ OpenNext build completed
[Post-Build] Adding scheduled handler to OpenNext worker...
[Post-Build] ✅ Successfully added scheduled handler to worker.js
```

**Verify the build:**
```bash
# Check that the scheduled handler was injected
cat .open-next/worker.js | grep -A 5 "async scheduled"
```

You should see the scheduled handler code in the worker.

---

## Step 2: Test Manual Check (Verify Refactor Works)

Before testing the scheduled handler, make sure the refactored manual check still works.

### 2A. Start Local Dev Server

```bash
npm run preview
# or
npx wrangler dev .open-next/worker.js --port 8787
```

### 2B. Test Manual Check via Browser

1. Open browser to `http://localhost:8787`
2. Login with your user account
3. Navigate to **Monitoring** page
4. Click **"Run Manual Check"**
5. Watch the real-time progress updates

**Expected behavior:**
- Progress bar shows clan checking progress
- Clans are processed in batches of 20
- Results display with leavers count
- No errors in browser console or terminal

### 2C. Test Manual Check via API (curl)

```bash
# First, get your session cookie by logging in via browser, then:

curl -X POST http://localhost:8787/api/monitoring/manual-check \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchStart": 0, "batchSize": 20}'
```

**Expected output:** Streaming SSE events like:
```
data: {"type":"start","message":"Starting monitoring check..."}
data: {"type":"clan_start","message":"Checking clan [TAG] Name (1/10)"...}
data: {"type":"clan_complete","message":"Completed [TAG]: 5 leavers found"...}
```

---

## Step 3: Test Scheduled Handler Locally

Cloudflare Workers supports testing scheduled events locally.

### Method 1: Using Wrangler CLI (Recommended)

```bash
# Trigger the scheduled handler manually
npx wrangler dev .open-next/worker.js --test-scheduled --port 8787
```

In another terminal, trigger the cron:
```bash
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

### Method 2: Create a Test Endpoint

Add a test endpoint to trigger scheduled monitoring manually:

**Create `src/app/api/test-scheduled/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/cloudflare';
import { scheduledMonitoring } from '@/scheduled';

export async function POST(request: NextRequest) {
  const db = await getDB();
  if (!db) {
    return NextResponse.json({ error: 'Database not found' }, { status: 500 });
  }

  // Create mock scheduled event
  const mockEvent = {
    scheduledTime: Date.now(),
    cron: '*/30 * * * *',
    waitUntil: (promise: Promise<unknown>) => {}
  };

  // Create mock execution context
  const mockCtx = {
    waitUntil: (promise: Promise<unknown>) => {},
    passThroughOnException: () => {}
  };

  // Create mock env
  const mockEnv = {
    DB: db,
    WARGAMING_APPLICATION_ID: process.env.WARGAMING_APPLICATION_ID || '',
    WARGAMING_REALM: process.env.WARGAMING_REALM || 'eu',
    WARGAMING_API_BASE_URL: process.env.WARGAMING_API_BASE_URL || ''
  };

  try {
    // Run scheduled monitoring
    await scheduledMonitoring(mockEvent as any, mockEnv as any, mockCtx as any);

    return NextResponse.json({
      success: true,
      message: 'Scheduled monitoring triggered successfully'
    });
  } catch (error) {
    console.error('Test scheduled error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

**Then test it:**

```bash
# Rebuild
npm run build:worker

# Start dev server
npx wrangler dev .open-next/worker.js --port 8787

# In another terminal, trigger the test endpoint
curl -X POST http://localhost:8787/api/test-scheduled
```

**Watch the logs in the wrangler dev terminal:**

Expected output:
```
[Scheduled Monitoring] Starting automated monitoring check...
[Scheduled Monitoring] Config: { check_interval: 'daily', ... }
[Monitoring Service] Processing clans 1-20 of 50...
[Monitoring Service] Checking clan: [TAG] Name
[Monitoring Service] Found 3 leavers from [TAG]
...
[Scheduled Monitoring] Completed successfully
[Scheduled Monitoring] Summary: { total_clans_checked: 50, total_leavers: 25, ... }
```

---

## Step 4: Test Discord Notifications

### 4A. Set Up Discord Webhook

1. Go to your Discord server
2. Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL
5. Save it in monitoring config (via app or database)

### 4B. Test Notifications

**Option 1: Via Monitoring Config UI**
1. Navigate to Monitoring Config in your app
2. Paste Discord webhook URL
3. Enable "Player Left" notifications
4. Save settings

**Option 2: Via Database (Direct)**

```bash
npx wrangler d1 execute wot-watcher-db --local --command="
  UPDATE monitoring_config
  SET discord_webhook_url = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL',
      notification_player_left = 1
  WHERE id = 1;
"
```

**Trigger a test:**

```bash
# Run manual check or test scheduled endpoint
curl -X POST http://localhost:8787/api/test-scheduled
```

**Check Discord** - You should see a message like:

```
🚨 Clan Monitoring Alert
Found 25 player(s) leaving 10 clan(s)

[TAG] Clan Name
• PlayerName1 (2025-01-04 12:30:00)
• PlayerName2 (2025-01-04 11:15:00)
...
```

---

## Step 5: Test Scheduling Logic

Test that the scheduled handler respects the `check_interval` setting.

### 5A. Set Last Check to Recent Time

```bash
npx wrangler d1 execute wot-watcher-db --local --command="
  UPDATE monitoring_config
  SET last_global_check = datetime('now'),
      check_interval = 'daily'
  WHERE id = 1;
"
```

### 5B. Trigger Scheduled Handler

```bash
curl -X POST http://localhost:8787/api/test-scheduled
```

**Expected:** Logs should show:
```
[Scheduled Monitoring] Skipping: last check was too recent for daily interval
```

### 5C. Set Last Check to Old Time

```bash
npx wrangler d1 execute wot-watcher-db --local --command="
  UPDATE monitoring_config
  SET last_global_check = datetime('now', '-25 hours'),
      check_interval = 'daily'
  WHERE id = 1;
"
```

### 5D. Trigger Again

```bash
curl -X POST http://localhost:8787/api/test-scheduled
```

**Expected:** Should run monitoring and update `last_global_check`

---

## Step 6: Deploy to Production

Once local testing passes, deploy to production:

```bash
npm run deploy
```

**Expected output:**
```
> npm run build:worker && wrangler deploy

✓ Built successfully
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded wot-clan-watcher (x.xx sec)
Published wot-clan-watcher (x.xx sec)
  https://clanspy.win
  https://wot-clan-watcher.your-subdomain.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Step 7: Monitor Production Cron

### 7A. View Cron Triggers

```bash
npx wrangler deployments list
```

### 7B. Watch Real-Time Logs

```bash
npx wrangler tail
```

**Expected output every 30 minutes:**
```
[Worker] Scheduled event triggered
[Scheduled Monitoring] Starting automated monitoring check...
[Scheduled Monitoring] Cron: */30 * * * *
[Scheduled Monitoring] Scheduled time: 2025-01-04T12:30:00.000Z
...
[Scheduled Monitoring] Completed successfully
```

### 7C. Check Cron History in Dashboard

1. Go to Cloudflare Dashboard
2. Workers & Pages → wot-clan-watcher
3. Click "Logs" tab
4. Filter by "scheduled" event type

You should see cron executions every 30 minutes.

---

## Step 8: Verify Database Updates

After scheduled monitoring runs, check that the database was updated:

```bash
# Check last_global_check was updated
npx wrangler d1 execute wot-watcher-db --command="
  SELECT last_global_check, check_interval
  FROM monitoring_config
  WHERE id = 1;
"

# Check that clans were checked
npx wrangler d1 execute wot-watcher-db --command="
  SELECT clan_id, tag, last_checked, last_member_count, status
  FROM monitored_clans
  WHERE enabled = 1
  ORDER BY last_checked DESC
  LIMIT 10;
"
```

---

## Troubleshooting

### Issue: "Cannot find module '@/scheduled'"

**Solution:** Make sure you ran `npm run build:worker` to build with the post-build script.

### Issue: Scheduled handler not running in production

**Check:**
1. Verify cron trigger in wrangler.toml: `[triggers]` section exists
2. Check deployment: `npx wrangler deployments list`
3. View logs: `npx wrangler tail`
4. Verify in Cloudflare Dashboard → Workers → Triggers tab

### Issue: "Database configuration error"

**Solution:**
```bash
# Check D1 binding
npx wrangler d1 list

# Verify wrangler.toml has correct database_id
cat wrangler.toml | grep database_id
```

### Issue: No Discord notifications

**Check:**
1. Webhook URL is correct in database
2. `notification_player_left` is set to 1
3. There are actually leavers detected
4. Discord webhook is not rate-limited

**Test webhook manually:**
```bash
curl -X POST 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Test message from WoT Clan Watcher"
  }'
```

### Issue: "Hours since last check: NaN"

**Solution:** Initialize `last_global_check`:
```bash
npx wrangler d1 execute wot-watcher-db --command="
  UPDATE monitoring_config
  SET last_global_check = datetime('now', '-2 days')
  WHERE id = 1;
"
```

---

## Success Criteria

✅ Manual check works via browser UI
✅ Manual check works via API
✅ Scheduled handler can be triggered locally
✅ Discord notifications are sent
✅ Scheduling logic respects check_interval
✅ Production cron runs every 30 minutes
✅ Database is updated after each run
✅ Logs show successful monitoring

---

## Monitoring in Production

**Set up alerts:**

1. **Cloudflare Dashboard:**
   - Workers & Pages → wot-clan-watcher → Metrics
   - Set up notifications for errors

2. **Discord notifications:**
   - Successful monitoring will post to Discord
   - If no notifications for 24h, check logs

3. **Database monitoring:**
   ```bash
   # Check when last monitoring ran
   npx wrangler d1 execute wot-watcher-db --command="
     SELECT
       last_global_check,
       CAST((julianday('now') - julianday(last_global_check)) * 24 AS INTEGER) as hours_ago
     FROM monitoring_config
     WHERE id = 1;
   "
   ```

---

## Next Steps

Once testing is complete:

1. **Adjust cron schedule** if needed (edit wrangler.toml `crons` field)
2. **Configure check_interval** per your needs (hourly/daily)
3. **Enable notifications** for all users
4. **Monitor for 24-48 hours** to ensure stability
5. **Create pull request** to merge to main branch

Happy monitoring! 🎉
