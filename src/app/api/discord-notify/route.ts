import { NextRequest } from 'next/server';
import { PlayerExclusionAlert } from '@/types/monitoring';
import { getMonitoringConfig } from '@/lib/monitoring-storage';
import { withDB, withAuth } from '@/lib/api-guards';
import { ok, fail, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth.error) return auth.error;

    const dbResult = await withDB();
    if (dbResult.error) return dbResult.error;
    const { db } = dbResult;

    const { alert }: { alert: PlayerExclusionAlert } = await request.json();
    const config = await getMonitoringConfig(db);

    if (!config.discord_webhook_url) {
      return fail('Discord webhook URL not configured', 400);
    }

    const embed = {
      title: "🚪 Player Left Clan",
      color: 0xff6b6b,
      fields: [
        { name: "Player", value: `**${alert.player_name}** (ID: ${alert.player_id})`, inline: true },
        { name: "Clan", value: `[${alert.clan_tag}] ${alert.clan_name}`, inline: true },
        { name: "Previous Role", value: alert.previous_role, inline: true },
        { name: "Left At", value: `<t:${Math.floor(new Date(alert.excluded_at).getTime() / 1000)}:f>`, inline: false }
      ],
      footer: {
        text: "Clan Watcher",
        icon_url: "https://eu.wargaming.net/static/3.132.1/common/img/app/wot/logo_wot.png"
      },
      timestamp: alert.excluded_at
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(config.discord_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return fail(`Discord API error: ${response.status}`);
      }

      return ok({ message: 'Discord notification sent' });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return fail('Discord webhook request timeout');
      }
      throw fetchError;
    }
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Failed to send Discord notification');
  }
}
