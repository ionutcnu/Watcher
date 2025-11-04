#!/usr/bin/env node
/**
 * Post-build script to add scheduled event handler to OpenNext worker
 *
 * This script modifies the generated .open-next/worker.js to add
 * support for Cloudflare Workers cron triggers (scheduled events).
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const workerPath = join(projectRoot, '.open-next/worker.js');

console.log('[Post-Build] Adding scheduled handler to OpenNext worker...');
console.log('[Post-Build] Worker path:', workerPath);

try {
  // Read the generated worker
  const workerContent = readFileSync(workerPath, 'utf-8');

  // Check if scheduled handler already exists
  if (workerContent.includes('async scheduled(')) {
    console.log('[Post-Build] Scheduled handler already exists, skipping...');
    process.exit(0);
  }

  // Find the export default statement
  const exportMatch = workerContent.match(/export default {[\s\S]*?};/);

  if (!exportMatch) {
    console.error('[Post-Build] Could not find export default statement in worker.js');
    process.exit(1);
  }

  const originalExport = exportMatch[0];

  // Create the new export with scheduled handler
  // We need to inject the scheduled handler code
  const scheduledHandlerCode = `
// Scheduled monitoring import and handler added by post-build script
import { scheduledMonitoring } from '../src/scheduled.ts';

`;

  const newExport = originalExport.replace(
    /export default {/,
    `export default {
  // Automated monitoring via Cloudflare Workers cron triggers
  async scheduled(event, env, ctx) {
    console.log('[Worker] Scheduled event triggered at', new Date(event.scheduledTime).toISOString());
    try {
      const { scheduledMonitoring } = await import('../src/scheduled.ts');
      ctx.waitUntil(scheduledMonitoring(event, env, ctx));
    } catch (error) {
      console.error('[Worker] Error in scheduled handler:', error);
    }
  },`
  );

  // Replace in content
  const modifiedContent = workerContent.replace(originalExport, newExport);

  // Write back
  writeFileSync(workerPath, modifiedContent, 'utf-8');

  console.log('[Post-Build] ✅ Successfully added scheduled handler to worker.js');
  console.log('[Post-Build] Automated monitoring will run every 30 minutes via cron trigger');

} catch (error) {
  console.error('[Post-Build] Error modifying worker.js:', error);
  process.exit(1);
}
