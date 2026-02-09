'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ClanHistoryEvent {
  type: string;
  subtype: string;
  player: { account_id: number; account_name: string };
  timestamp: number;
  date: string;
  time: string;
  role: string;
  group: string;
  description: string;
  initiator: number;
  initiatorName: string | null;
}

interface UseClanHistoryOptions {
  selectedClan: { clan_id: number; tag: string; name: string } | null;
}

export function useClanHistory({ selectedClan }: UseClanHistoryOptions) {
  const [allEvents, setAllEvents] = useState<ClanHistoryEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ClanHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [eventLimit, setEventLimit] = useState(10);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const applyFilters = useCallback((events: ClanHistoryEvent[]) => {
    let filtered = events;
    if (eventTypeFilter !== 'all') {
      filtered = events.filter(event => event.type === eventTypeFilter);
    }
    setFilteredEvents(filtered.slice(0, eventLimit));
  }, [eventTypeFilter, eventLimit]);

  useEffect(() => {
    if (allEvents.length > 0) {
      applyFilters(allEvents);
    }
  }, [eventTypeFilter, eventLimit, allEvents, applyFilters]);

  const loadClanHistory = useCallback(async () => {
    if (!selectedClan) return;

    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/clan-newsfeed?clanId=${selectedClan.clan_id}`);
      const rawData = await response.json();

      const events: ClanHistoryEvent[] = [];
      const allAccountIds = new Set<number>();

      if (rawData?.items && Array.isArray(rawData.items)) {
        for (const item of rawData.items) {
          if (item.accounts_ids) {
            item.accounts_ids.forEach((id: number) => allAccountIds.add(id));
          }
          if (item.initiator_id) allAccountIds.add(item.initiator_id);
          if (item.created_by) allAccountIds.add(item.created_by);
          if (item.actor_id) allAccountIds.add(item.actor_id);
        }

        let playerNames: Record<number, string> = {};
        if (allAccountIds.size > 0) {
          const namesResponse = await fetch('/api/get-player-names', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountIds: Array.from(allAccountIds) })
          });
          const namesResult = await namesResponse.json();
          playerNames = namesResult.playerNames || {};
        }

        for (const item of rawData.items) {
          const timestamp = new Date(item.created_at).getTime() / 1000;
          const initiatorId = item.initiator_id || item.created_by || item.actor_id;
          const initiatorName = initiatorId && playerNames[initiatorId] ? playerNames[initiatorId] : null;

          if (item.subtype === 'change_role') {
            if (item.additional_info && item.accounts_ids) {
              for (const accountId of item.accounts_ids) {
                const playerRoleChanges = item.additional_info[accountId.toString()];
                if (playerRoleChanges && playerRoleChanges.length > 0) {
                  const roleChange = playerRoleChanges[0];
                  const oldRole = roleChange.old_role?.localized || roleChange.old_role?.name || 'Unknown';
                  const newRole = roleChange.new_role?.localized || roleChange.new_role?.name || 'Unknown';
                  const playerName = playerNames[accountId] || `Player_${accountId}`;

                  events.push({
                    type: 'role_change',
                    subtype: item.subtype,
                    player: { account_id: accountId, account_name: playerName },
                    timestamp,
                    date: new Date(timestamp * 1000).toISOString().split('T')[0],
                    time: new Date(timestamp * 1000).toLocaleString(),
                    role: newRole,
                    group: item.group === 'military_personnel' ? 'Military Personnel' : item.group,
                    description: `Player ${playerName} has been assigned to a new clan position: ${oldRole} → ${newRole}`,
                    initiator: item.initiator_id,
                    initiatorName: initiatorName
                  });
                }
              }
            }
          } else if (item.subtype === 'join_clan' || item.subtype === 'leave_clan') {
            if (item.accounts_ids) {
              for (const accountId of item.accounts_ids) {
                const playerName = playerNames[accountId] || `Player_${accountId}`;
                const type = item.subtype === 'join_clan' ? 'join' : 'leave';
                events.push({
                  type,
                  subtype: item.subtype,
                  player: { account_id: accountId, account_name: playerName },
                  timestamp,
                  date: new Date(timestamp * 1000).toISOString().split('T')[0],
                  time: new Date(timestamp * 1000).toLocaleString(),
                  role: 'Member',
                  group: item.group === 'military_personnel' ? 'Military Personnel' : item.group,
                  description: type === 'join'
                    ? `Player ${playerName} has been accepted to the clan.`
                    : `Player ${playerName} has been excluded from this clan.`,
                  initiator: item.initiator_id,
                  initiatorName: initiatorName
                });
              }
            }
          }
        }
      }

      events.sort((a, b) => b.timestamp - a.timestamp);
      setAllEvents(events);
      // applyFilters will be called automatically by useEffect when allEvents changes
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to load clan history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedClan]);

  const escapeCsv = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = useCallback((recentChanges: Array<{ date: string; type: string; player: { account_name: string; account_id: number }; clan: { tag: string; name: string } }>) => {
    const dataToExport = allEvents.length > 0 ? allEvents : recentChanges;
    if (!dataToExport.length) return;

    let csvContent: string;

    if (allEvents.length > 0) {
      csvContent = [
        'Date,Time,Type,Player,Account_ID,Role,Group,Description,Initiator',
        ...allEvents.map(event => {
          const date = new Date(event.timestamp * 1000).toLocaleDateString('en-GB');
          const time = new Date(event.timestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          return `${escapeCsv(date)},${escapeCsv(time)},${escapeCsv(event.type)},${escapeCsv(event.player.account_name)},${event.player.account_id},${escapeCsv(event.role)},${escapeCsv(event.group)},${escapeCsv(event.description)},${escapeCsv(event.initiatorName || 'Unknown')}`;
        })
      ].join('\n');
    } else {
      csvContent = [
        'Date,Type,Player,Clan,Tag',
        ...recentChanges.map(change =>
          `${escapeCsv(change.date)},${escapeCsv(change.type)},${escapeCsv(change.player.account_name)},${escapeCsv(`[${change.clan.tag}] ${change.clan.name}`)},${escapeCsv(change.clan.tag)}`
        )
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = allEvents.length > 0
      ? `clan-history-${selectedClan?.tag || 'unknown'}-${allEvents.length}-events-${new Date().toISOString().split('T')[0]}.csv`
      : `clan-changes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allEvents, selectedClan]);

  return {
    allEvents,
    filteredEvents,
    historyLoading,
    showHistory,
    setShowHistory,
    eventLimit,
    setEventLimit,
    eventTypeFilter,
    setEventTypeFilter,
    loadClanHistory,
    exportToCSV,
  };
}
