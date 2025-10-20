'use client';

import { useState, useEffect } from 'react';
import { ClanChange } from '@/types/clan';
import { ModernBackground } from '@/components/ui/modern-background';
import { StatCard } from '@/components/ui/stat-card';
import { TacticalLoader } from '@/components/ui/tactical-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ScanResult {
  success: boolean;
  clan?: {
    clan_id: number;
    tag: string;
    name: string;
    members: Array<{
      account_id: number;
      account_name: string;
      joined_at: number;
      role: string;
    }>;
  };
  changes?: ClanChange[];
  summary?: {
    total_members: number;
    joins: number;
    leaves: number;
  };
}

export default function Home() {
  const [clanSearch, setClanSearch] = useState('');
  const [selectedClan, setSelectedClan] = useState<{clan_id: number, tag: string, name: string} | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{clan_id: number, tag: string, name: string}>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentChanges, setRecentChanges] = useState<ClanChange[]>([]);
  const [clanHistory, setClanHistory] = useState<Array<{
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
    initiatorName: string;
  }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [eventLimit, setEventLimit] = useState(10);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [allClanHistory, setAllClanHistory] = useState<Array<{
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
    initiatorName: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  const searchClans = async () => {
    if (!clanSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search-clans?search=${encodeURIComponent(clanSearch)}`);
      const result = await response.json();
      setSearchResults(result.clans || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const scanClan = async () => {
    if (!selectedClan) {
      setError('Please select a clan first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scan-clan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: selectedClan.clan_id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Scan failed');
      }

      setScanResult(result);
      loadRecentChanges();

      // If no changes detected (first scan or no activity), automatically load clan history
      if (!result.changes || result.changes.length === 0) {
        loadClanHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentChanges = async () => {
    try {
      const response = await fetch('/api/changes?days=7');
      const result = await response.json();
      setRecentChanges(result.changes || []);
    } catch (err) {
      console.error('Failed to load recent changes:', err);
    }
  };

  const loadClanHistory = async () => {
    if (!selectedClan) return;

    setHistoryLoading(true);
    try {
      // Call the Wargaming API directly
      const now = new Date();
      const dateUntil = now.toISOString();
      const offset = Math.abs(now.getTimezoneOffset() * 60);
      
      const url = `https://eu.wargaming.net/clans/wot/${selectedClan.clan_id}/newsfeed/api/events/?date_until=${encodeURIComponent(dateUntil)}&offset=${offset}`;
      
      const response = await fetch(`/api/proxy-clan-history?url=${encodeURIComponent(url)}`);
      const rawData = await response.json();
      
      // Parse the real events from the API
      const events = [];
      const allAccountIds = new Set<number>();
      
      if (rawData?.items && Array.isArray(rawData.items)) {
        console.log('Found items:', rawData.items.length);
        
        // First pass: collect all account IDs and log the structure
        for (const item of rawData.items) {
          console.log('Event item structure:', {
            subtype: item.subtype,
            initiator_id: item.initiator_id,
            accounts_ids: item.accounts_ids,
            created_by: item.created_by,
            actor_id: item.actor_id,
            all_keys: Object.keys(item)
          });
          
          if (item.accounts_ids) {
            item.accounts_ids.forEach((id: number) => allAccountIds.add(id));
          }
          if (item.initiator_id) {
            allAccountIds.add(item.initiator_id);
          }
          // Check for other possible initiator fields
          if (item.created_by) {
            allAccountIds.add(item.created_by);
          }
          if (item.actor_id) {
            allAccountIds.add(item.actor_id);
          }
        }
        
        // Fetch player names for all account IDs
        const response = await fetch('/api/get-player-names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountIds: Array.from(allAccountIds) })
        });
        
        const { playerNames } = await response.json();
        console.log('Player names:', playerNames);
        
        // Second pass: build events with names
        for (const item of rawData.items) {
          const timestamp = new Date(item.created_at).getTime() / 1000;
          
          // Try to find the initiator from multiple possible fields
          const initiatorId = item.initiator_id || item.created_by || item.actor_id;
          let initiatorName = null;
          
          if (initiatorId && playerNames[initiatorId]) {
            initiatorName = playerNames[initiatorId];
          }
          
          // Log what we found for debugging
          console.log('Event initiator debug:', {
            initiator_id: item.initiator_id,
            created_by: item.created_by,
            actor_id: item.actor_id,
            finalId: initiatorId,
            finalName: initiatorName
          });
          
          if (item.subtype === 'change_role') {
            // Handle role changes - multiple players can be affected
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
                    player: {
                      account_id: accountId,
                      account_name: playerName
                    },
                    timestamp: timestamp,
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
          } else if (item.subtype === 'join_clan') {
            // Handle joins
            if (item.accounts_ids) {
              for (const accountId of item.accounts_ids) {
                const playerName = playerNames[accountId] || `Player_${accountId}`;
                events.push({
                  type: 'join',
                  subtype: item.subtype,
                  player: {
                    account_id: accountId,
                    account_name: playerName
                  },
                  timestamp: timestamp,
                  date: new Date(timestamp * 1000).toISOString().split('T')[0],
                  time: new Date(timestamp * 1000).toLocaleString(),
                  role: 'Member',
                  group: item.group === 'military_personnel' ? 'Military Personnel' : item.group,
                  description: `Player ${playerName} has been accepted to the clan.`,
                  initiator: item.initiator_id,
                  initiatorName: initiatorName
                });
              }
            }
          } else if (item.subtype === 'leave_clan') {
            // Handle leaves
            if (item.accounts_ids) {
              for (const accountId of item.accounts_ids) {
                const playerName = playerNames[accountId] || `Player_${accountId}`;
                events.push({
                  type: 'leave',
                  subtype: item.subtype,
                  player: {
                    account_id: accountId,
                    account_name: playerName
                  },
                  timestamp: timestamp,
                  date: new Date(timestamp * 1000).toISOString().split('T')[0],
                  time: new Date(timestamp * 1000).toLocaleString(),
                  role: 'Member',
                  group: item.group === 'military_personnel' ? 'Military Personnel' : item.group,
                  description: `Player ${playerName} has been excluded from this clan.`,
                  initiator: item.initiator_id,
                  initiatorName: initiatorName
                });
              }
            }
          }
        }
      }

      events.sort((a, b) => b.timestamp - a.timestamp);

      // Store all events and show limited events
      setAllClanHistory(events);
      applyFiltersAndLimits(events);
      setShowHistory(true);

    } catch (err) {
      console.error('Failed to load clan history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const applyFiltersAndLimits = (events: typeof allClanHistory) => {
    // Apply event type filter
    let filteredEvents = events;
    if (eventTypeFilter !== 'all') {
      filteredEvents = events.filter(event => {
        console.log('Event type:', event.type, 'Filter:', eventTypeFilter, 'Match:', event.type === eventTypeFilter);
        return event.type === eventTypeFilter;
      });
    }
    
    // Apply limit
    const limitedEvents = filteredEvents.slice(0, eventLimit);
    
    console.log('Filter applied:', eventTypeFilter, 'Total:', events.length, 'Filtered:', filteredEvents.length, 'Showing:', limitedEvents.length);
    console.log('Sample events:', events.slice(0, 3).map(e => ({ type: e.type, description: e.description })));
    setClanHistory(limitedEvents);
  };

  const exportToCSV = () => {
    // Use all clan history events for export, not just the limited display
    const dataToExport = allClanHistory.length > 0 ? allClanHistory : recentChanges;
    
    if (!dataToExport.length) return;

    let csvContent;
    
    if (allClanHistory.length > 0) {
      // Export all clan history data
      csvContent = [
        'Date,Time,Type,Player,Account_ID,Role,Group,Description,Initiator',
        ...allClanHistory.map(event => {
          const date = new Date(event.timestamp * 1000).toLocaleDateString('en-GB');
          const time = new Date(event.timestamp * 1000).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          });
          return `${date},${time},${event.type},${event.player.account_name},${event.player.account_id},${event.role},${event.group},"${event.description}",${event.initiatorName || 'Unknown'}`;
        })
      ].join('\n');
    } else {
      // Export recent changes data (fallback)
      csvContent = [
        'Date,Type,Player,Clan,Tag',
        ...recentChanges.map(change => 
          `${change.date},${change.type},${change.player.account_name},[${change.clan.tag}] ${change.clan.name},${change.clan.tag}`
        )
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const filename = allClanHistory.length > 0 
      ? `clan-history-${selectedClan?.tag || 'unknown'}-${allClanHistory.length}-events-${new Date().toISOString().split('T')[0]}.csv`
      : `clan-changes-${new Date().toISOString().split('T')[0]}.csv`;
    
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadRecentChanges();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClans();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [clanSearch]);

  useEffect(() => {
    if (allClanHistory.length > 0) {
      applyFiltersAndLimits(allClanHistory);

      // Update scan result summary with history counts
      if (scanResult) {
        const joins = allClanHistory.filter(e => e.type === 'join').length;
        const leaves = allClanHistory.filter(e => e.type === 'leave').length;

        setScanResult(prev => prev ? {
          ...prev,
          summary: {
            ...prev.summary!,
            joins,
            leaves
          }
        } : null);
      }
    }
  }, [eventTypeFilter, eventLimit, allClanHistory.length]);

  return (
    <ModernBackground>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Hero Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
            World of Tanks Clan Watcher
          </h1>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Monitor clan activity, track member changes, and analyze clan statistics in real-time
          </p>
          <Button asChild size="lg" className="text-base">
            <a href="/monitoring">
              View Dashboard →
            </a>
          </Button>
        </motion.div>

        {/* Scan Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Scan Clan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
          
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="clan-search">Search Clans</Label>
              <Input
                id="clan-search"
                type="text"
                value={clanSearch}
                onChange={(e) => setClanSearch(e.target.value)}
                placeholder="Enter clan name or tag (e.g., HAVOK, -G-)"
              />
              {searchLoading && (
                <div className="mt-2">
                  <TacticalLoader variant="spinner" size="sm" color="green" message="Searching..." />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results</Label>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((clan) => (
                    <motion.div
                      key={clan.clan_id}
                      onClick={() => setSelectedClan(clan)}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClan?.clan_id === clan.clan_id
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-border hover:border-accent-primary/50 bg-surface'
                      }`}
                    >
                      <div className="font-medium text-text-primary">
                        [{clan.tag}] {clan.name}
                      </div>
                      <div className="text-text-secondary text-sm mt-1">
                        ID: {clan.clan_id}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Clan & Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label>Selected Clan</Label>
                <div className="px-4 py-3 bg-surface rounded-md border border-border min-h-[46px] flex items-center">
                  {selectedClan ? (
                    <span className="text-text-primary">
                      [{selectedClan.tag}] {selectedClan.name}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">No clan selected</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <Button
                  onClick={scanClan}
                  disabled={loading || !selectedClan}
                  size="lg"
                >
                  {loading ? 'Scanning...' : 'Scan Now'}
                </Button>
                <Button
                  onClick={loadClanHistory}
                  disabled={historyLoading || !selectedClan}
                  variant="secondary"
                  size="lg"
                >
                  {historyLoading ? 'Loading...' : 'History'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-danger/10 border border-danger rounded-md">
                <p className="text-danger text-sm font-medium">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan Results */}
        {scanResult && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Members"
                  value={scanResult.summary?.total_members || 0}
                  delay={0.1}
                />
                <StatCard
                  title="New Joins"
                  value={scanResult.summary?.joins || 0}
                  delay={0.2}
                />
                <StatCard
                  title="Leaves"
                  value={scanResult.summary?.leaves || 0}
                  delay={0.3}
                />
              </div>

              {scanResult.clan && (
                <div>
                  <h3 className="font-medium text-text-primary">
                    [{scanResult.clan.tag}] {scanResult.clan.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Clan ID: {scanResult.clan.clan_id}
                  </p>
                </div>
              )}

              {scanResult.changes && scanResult.changes.length > 0 && (
                <div>
                  <h3 className="font-medium text-text-primary mb-3">Recent Changes</h3>
                  <div className="space-y-2">
                    {scanResult.changes.map((change, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          change.type === 'join'
                            ? 'bg-success/10 border-success'
                            : 'bg-danger/10 border-danger'
                        }`}
                      >
                        <Badge variant={change.type === 'join' ? 'default' : 'destructive'} className="mr-2">
                          {change.type.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-text-primary">{change.player.account_name}</span>
                        <span className="text-text-secondary text-sm ml-2">
                          ({change.player.account_id})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clan History */}
        {showHistory && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Clan History - [{selectedClan?.tag}] {selectedClan?.name}
                </CardTitle>
                <Button
                  onClick={() => setShowHistory(false)}
                  variant="ghost"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="text-sm text-text-secondary">
                  Found {allClanHistory.length} events, showing {clanHistory.length}
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="event-limit" className="text-sm">Show:</Label>
                    <select
                      id="event-limit"
                      value={eventLimit}
                      onChange={(e) => setEventLimit(parseInt(e.target.value))}
                      className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm"
                    >
                      <option value={5}>5 events</option>
                      <option value={10}>10 events</option>
                      <option value={25}>25 events</option>
                      <option value={50}>50 events</option>
                      <option value={100}>100 events</option>
                      <option value={allClanHistory.length}>All events</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="event-filter" className="text-sm">Filter:</Label>
                    <select
                      id="event-filter"
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                      className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm"
                    >
                      <option value="all">All events</option>
                      <option value="join">Joins only</option>
                      <option value="leave">Leaves only</option>
                      <option value="role_change">Position changes only</option>
                    </select>
                  </div>
                </div>
              </div>
            
            {clanHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Group events by date */}
                {Object.entries(
                  clanHistory.reduce((groups, event) => {
                    const date = event.date;
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(event);
                    return groups;
                  }, {} as Record<string, typeof clanHistory>)
                ).map(([date, events]) => (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-text-primary">
                        {new Date(date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {events.map((event, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-surface/50 border-l-4 rounded-lg overflow-hidden hover:bg-surface/80 transition-colors"
                          style={{
                            borderLeftColor: event.type === 'join' ? 'var(--success)' : event.type === 'leave' ? 'var(--danger)' : 'var(--accent-primary)'
                          }}
                        >
                          <div className="flex items-start gap-4 p-4">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center text-xl">
                                👤
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                                event.type === 'join' ? 'bg-success' :
                                event.type === 'leave' ? 'bg-danger' :
                                'bg-accent-primary'
                              }`}>
                                {event.type === 'join' && '+'}
                                {event.type === 'leave' && '✕'}
                                {event.type === 'role_change' && '↗'}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-text-primary font-semibold">
                                  {event.type === 'join' && 'Joined Clan'}
                                  {event.type === 'leave' && 'Left Clan'}
                                  {event.type === 'role_change' && 'Role Changed'}
                                </h4>
                                <Badge variant="outline" className="shrink-0">
                                  {event.type}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-2">
                                <span>{new Date(event.timestamp * 1000).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })} {new Date(event.timestamp * 1000).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                                {event.initiatorName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-warning">By {event.initiatorName}</span>
                                  </>
                                )}
                              </div>

                              <p className="text-text-primary text-sm">
                                {event.description}
                              </p>

                              {event.type === 'role_change' && event.role && (
                                <div className="mt-2">
                                  <Badge className="bg-accent-primary/20 text-accent-primary border-accent-primary">
                                    {event.role}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-text-secondary mb-2">No history data available for this clan.</p>
                <p className="text-sm text-text-tertiary">Try a different clan or check back later.</p>
              </div>
            )}
            </CardContent>
          </Card>
        )}

        {/* Recent Changes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Changes (7 days)</CardTitle>
              <Button
                onClick={exportToCSV}
                disabled={!recentChanges.length && !allClanHistory.length}
                variant="secondary"
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>

            {recentChanges.length > 0 ? (
              <div className="space-y-3">
                {recentChanges.map((change, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-4 bg-surface/50 rounded-lg hover:bg-surface/80 transition-colors border border-border/40"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Badge variant={change.type === 'join' ? 'default' : 'destructive'}>
                        {change.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {change.player.account_name}
                        </p>
                        <p className="text-sm text-text-secondary">
                          [{change.clan.tag}] {change.clan.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-text-tertiary whitespace-nowrap">
                      {change.date}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-text-secondary">
                  No recent changes found. Scan some clans to see activity.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernBackground>
  );
}