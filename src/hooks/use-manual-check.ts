'use client';

import { useState } from 'react';
import type { TomatoPlayerStats } from '@/types/player-stats';

export interface ClanCheckResult {
  clan_id: number;
  clan_tag: string;
  clan_name: string;
  error?: string;
  count?: number;
  leavers?: Array<{
    player: { account_id: number; account_name: string };
    timestamp: number;
    date: string;
    time: string;
    description: string;
    stats: TomatoPlayerStats | null;
  }>;
  joiners?: Array<{
    player: { account_id: number; account_name: string };
    timestamp: number;
    date: string;
    time: string;
    description: string;
    stats: TomatoPlayerStats | null;
  }>;
}

export interface ManualCheckResults {
  success: boolean;
  error?: string;
  clans_checked?: number;
  total_leavers?: number;
  results?: ClanCheckResult[];
}

export function useManualCheck(onComplete?: () => void) {
  const [results, setResults] = useState<ManualCheckResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressDetails, setProgressDetails] = useState<{ current: number; total: number; type: string } | null>(null);
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
  const [statsLoading, setStatsLoading] = useState<Record<number, boolean>>({});
  const [statsLoaded, setStatsLoaded] = useState<Record<number, boolean>>({});

  const runManualCheck = async () => {
    setLoading(true);
    setResults(null);
    setProgressMessage('Starting manual check...');
    setProgressPercent(0);
    setProgressDetails(null);
    setStatsLoading({});
    setStatsLoaded({});

    const BATCH_SIZE = 20;
    let batchStart = 0;
    let allResults: ClanCheckResult[] = [];
    let totalLeavers = 0;
    let totalClans = 0;

    try {
      while (true) {
        const response = await fetch('/api/monitoring/manual-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchStart, batchSize: BATCH_SIZE })
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let hasMore = false;
        let nextBatchStart = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const message of messages) {
            if (!message.trim() || !message.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(message.slice(6));

              switch (data.type) {
                case 'start':
                case 'info':
                  setProgressMessage(data.message);
                  if (data.total) totalClans = data.total;
                  break;
                case 'clan_start':
                  setProgressMessage(data.message);
                  if (data.current && data.total) {
                    setProgressPercent((data.current / data.total) * 100);
                    setProgressDetails({ current: data.current, total: data.total, type: 'clans' });
                  }
                  break;
                case 'clan_complete':
                  setProgressMessage(data.message);
                  if (data.current && data.total) setProgressPercent((data.current / data.total) * 100);
                  break;
                case 'batch_complete':
                case 'complete':
                  setProgressMessage(data.message);
                  if (data.current && data.total) setProgressPercent((data.current / data.total) * 100);
                  if (data.results) allResults = [...allResults, ...data.results];
                  if (data.total_leavers !== undefined) totalLeavers += data.total_leavers;
                  if (data.total) totalClans = data.total;
                  hasMore = data.hasMore || false;
                  nextBatchStart = data.nextBatchStart || 0;
                  break;
                case 'error':
                  setProgressMessage('Error: ' + data.error);
                  setResults({ success: false, error: data.error, results: [] });
                  return;
              }
            } catch { /* skip parse errors */ }
          }
        }

        if (!hasMore) {
          setProgressMessage(`Manual check complete: ${totalClans} clans checked, ${totalLeavers} total leavers found.`);
          setProgressPercent(100);
          setResults({ success: true, clans_checked: totalClans, total_leavers: totalLeavers, results: allResults });

          const expanded: Record<number, boolean> = {};
          allResults.forEach(r => { expanded[r.clan_id] = false; });
          setExpandedResults(expanded);
          break;
        }

        batchStart = nextBatchStart;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      onComplete?.();
    } catch {
      setResults({ success: false, error: 'Manual check failed', results: [] });
      setProgressMessage('Manual check failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsForClan = async (clanId: number) => {
    if (!results?.results) return;
    const clanResult = results.results.find(r => r.clan_id === clanId);
    const hasLeavers = clanResult?.leavers && clanResult.leavers.length > 0;
    const hasJoiners = clanResult?.joiners && clanResult.joiners.length > 0;
    if (!hasLeavers && !hasJoiners) return;
    if (statsLoaded[clanId]) return;

    setStatsLoading(prev => ({ ...prev, [clanId]: true }));

    try {
      const accountIds: number[] = [];
      if (hasLeavers) accountIds.push(...clanResult.leavers!.map(l => l.player.account_id));
      if (hasJoiners) accountIds.push(...clanResult.joiners!.map(j => j.player.account_id));

      const response = await fetch('/api/player-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds, region: 'eu' })
      });
      const result = await response.json();

      if (result.success && result.stats) {
        setResults(prev => {
          if (!prev?.results) return prev;
          return {
            ...prev,
            results: prev.results.map(r => {
              if (r.clan_id === clanId) {
                return {
                  ...r,
                  leavers: r.leavers?.map(leaver => ({
                    ...leaver,
                    stats: result.stats[leaver.player.account_id] || null
                  })),
                  joiners: r.joiners?.map(joiner => ({
                    ...joiner,
                    stats: result.stats[joiner.player.account_id] || null
                  }))
                };
              }
              return r;
            })
          };
        });
        setStatsLoaded(prev => ({ ...prev, [clanId]: true }));
      }
    } catch { /* ignore */ } finally {
      setStatsLoading(prev => ({ ...prev, [clanId]: false }));
    }
  };

  const toggleResultExpanded = async (clanId: number) => {
    const wasExpanded = expandedResults[clanId];
    setExpandedResults(prev => ({ ...prev, [clanId]: !prev[clanId] }));
    if (!wasExpanded && !statsLoaded[clanId]) {
      await fetchStatsForClan(clanId);
    }
  };

  return {
    results, loading,
    progressMessage, progressPercent, progressDetails,
    expandedResults, statsLoading,
    runManualCheck, toggleResultExpanded,
    clearResults: () => setResults(null),
  };
}
