import { NextRequest, NextResponse } from 'next/server';
import { PlayerExclusionAlert } from '@/types/monitoring';
import { getMonitoringConfig } from '@/lib/monitoring-storage';
import { getDB } from '@/lib/cloudflare';

export async function POST(request: NextRequest) {
  try {
    const db = getDB();
    if (!db) {
      console.error('D1 database binding not found');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const { alert }: { alert: PlayerExclusionAlert } = await request.json();
    const config = await getMonitoringConfig(db);

    if (!config.discord_webhook_url) {
      return NextResponse.json({
        success: false,
        error: 'Discord webhook URL not configured'
      });
    }

    const embed = {
      title: "🚪 Player Left Clan",
      color: 0xff6b6b,
      fields: [
        {
          name: "Player",
          value: `**${alert.player_name}** (ID: ${alert.player_id})`,
          inline: true
        },
        {
          name: "Clan",
          value: `[${alert.clan_tag}] ${alert.clan_name}`,
          inline: true
        },
        {
          name: "Previous Role",
          value: alert.previous_role,
          inline: true
        },
        {
          name: "Left At",
          value: `<t:${Math.floor(new Date(alert.excluded_at).getTime() / 1000)}:f>`,
          inline: false
        }
      ],
      footer: {
        text: "Clan Watcher",
        icon_url: "https://eu.wargaming.net/static/3.132.1/common/img/app/wot/logo_wot.png"
      },
      timestamp: alert.excluded_at
    };

    const discordPayload = {
      embeds: [embed]
    };

    const response = await fetch(config.discord_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    return NextResponse.json({ success: true, message: 'Discord notification sent' });

  } catch (error) {
    console.error('Discord notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send Discord notification' },
      { status: 500 }
    );
  }
}
