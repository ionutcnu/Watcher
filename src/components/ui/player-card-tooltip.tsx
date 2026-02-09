'use client';

import { useState, useCallback } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getWN8Color, getWN8BgColor, getWN8Label } from '@/lib/wn8-colors';
import type { TomatoPlayerStats } from '@/types/player-stats';

interface PlayerCardTooltipProps {
  accountId: number;
  accountName: string;
  clanTag?: string;
  role?: string;
  children: React.ReactNode;
}

// Simple per-session cache
const statsCache = new Map<number, TomatoPlayerStats | null>();

export function PlayerCardTooltip({
  accountId, accountName, clanTag, role, children
}: PlayerCardTooltipProps) {
  const [stats, setStats] = useState<TomatoPlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchStats = useCallback(async () => {
    if (fetched) return;

    // Check cache
    if (statsCache.has(accountId)) {
      setStats(statsCache.get(accountId) ?? null);
      setFetched(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/player-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: [accountId], region: 'eu', days: 1000 })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      const playerStats = result.success ? (result.stats?.[accountId] ?? null) : null;
      statsCache.set(accountId, playerStats);
      setStats(playerStats);
    } catch (error) {
      statsCache.set(accountId, null);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [accountId, accountName, fetched]);

  const initials = accountName.slice(0, 2).toUpperCase();

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      fetchStats();
    }
  }, [fetchStats]);

  return (
    <Tooltip onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="p-0 w-[300px] bg-[#111] border-border rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(59,130,246,0.12),transparent_60%)]" />
          <div className="relative z-[1] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-surface-elevated to-surface border-2 border-border flex items-center justify-center font-extrabold text-sm text-text-secondary">
              {initials}
            </div>
            <div>
              <div className="font-bold text-sm text-text-primary">{accountName}</div>
              {clanTag && <div className="text-[11px] text-text-secondary">[{clanTag}]</div>}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="px-4 py-5 text-center text-text-tertiary text-xs">Loading stats...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-3 border-t border-border">
              <div className="px-3 py-2.5 text-center border-r border-border">
                <div className={`text-base font-extrabold font-mono ${getWN8Color(stats.wn8)}`}>
                  {Math.round(stats.wn8)}
                </div>
                <div className="text-[9px] text-text-tertiary uppercase tracking-wider mt-0.5">WN8 (All-Time)</div>
              </div>
              <div className="px-3 py-2.5 text-center border-r border-border">
                <div className="text-base font-extrabold font-mono text-text-primary">
                  {stats.winrate.toFixed(1)}%
                </div>
                <div className="text-[9px] text-text-tertiary uppercase tracking-wider mt-0.5">Win Rate</div>
              </div>
              <div className="px-3 py-2.5 text-center">
                <div className="text-base font-extrabold font-mono text-text-primary">
                  {stats.battles.toLocaleString()}
                </div>
                <div className="text-[9px] text-text-tertiary uppercase tracking-wider mt-0.5">Battles</div>
              </div>
            </div>
            {/* WN8 progress bar */}
            <div className="px-4 py-2">
              <div className="flex h-1 rounded-full overflow-hidden bg-border/30">
                <div
                  className={`h-full rounded-full ${getWN8BgColor(stats.wn8)}`}
                  style={{ width: `${Math.min(100, (stats.wn8 / 3500) * 100)}%` }}
                />
              </div>
            </div>
            {/* Footer */}
            <div className="px-4 py-2 bg-surface-elevated/30 border-t border-border flex items-center justify-between text-[10px] text-text-tertiary">
              <span>{getWN8Label(stats.wn8)}</span>
              {role && <span>{role}</span>}
            </div>
          </>
        ) : fetched ? (
          <div className="px-4 py-5 text-center text-text-tertiary text-xs">Stats unavailable</div>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
