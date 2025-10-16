'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MonitoredClan } from '@/types/monitoring';
import * as XLSX from 'xlsx';
import { ModernBackground } from '@/components/ui/modern-background';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TacticalLoader } from '@/components/ui/tactical-loader';
import { motion } from 'framer-motion';

interface TomatoPlayerStats {
  battles: number;
  avgTier: number;
  wn8: number;
  wnx: number;
  wins: number;
  winrate: number;
  survived: number;
  survivalRate: number;
  damage: number;
  avgDamage: number;
  damageRatio: number;
  frags: number;
  avgFrags: number;
  kdRatio: number;
}

function getWN8Color(wn8: number): string {
  if (wn8 >= 2450) return 'text-purple-400';
  if (wn8 >= 2150) return 'text-blue-400';
  if (wn8 >= 1750) return 'text-cyan-400';
  if (wn8 >= 1400) return 'text-green-400';
  if (wn8 >= 1050) return 'text-yellow-400';
  if (wn8 >= 750) return 'text-orange-400';
  return 'text-red-400';
}

export default function MonitoringPage() {
  const [monitoredClans, setMonitoredClans] = useState<MonitoredClan[]>([]);
  const [loading, setLoading] = useState(true);
  const [addClanSearch, setAddClanSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{clan_id: number, tag: string, name: string}>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualCheckResults, setManualCheckResults] = useState<{
    success: boolean;
    error?: string;
    clans_checked?: number;
    total_leavers?: number;
    results?: Array<{
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
    }>;
  } | null>(null);
  const [manualCheckLoading, setManualCheckLoading] = useState(false);
  const [monitoredClansExpanded, setMonitoredClansExpanded] = useState(true);
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressDetails, setProgressDetails] = useState<{
    current: number;
    total: number;
    type: string;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState<Record<number, boolean>>({});
  const [statsLoaded, setStatsLoaded] = useState<Record<number, boolean>>({});
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      tag: string;
      success: boolean;
      error?: string;
      clan_id?: number;
      name?: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMonitoredClans();
  }, []);

  const loadMonitoredClans = async () => {
    try {
      const response = await fetch('/api/monitored-clans');
      const result = await response.json();
      if (result.success) {
        setMonitoredClans(result.clans);
      }
    } catch (error) {
      console.error('Failed to load monitored clans:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchClans = useCallback(async () => {
    if (!addClanSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search-clans?search=${encodeURIComponent(addClanSearch)}`);
      const result = await response.json();
      setSearchResults(result.clans || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [addClanSearch]);

  const addClanToMonitoring = async (clan: {clan_id: number, tag: string, name: string}) => {
    try {
      const response = await fetch('/api/monitored-clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          clan_id: clan.clan_id,
          tag: clan.tag,
          name: clan.name,
          enabled: true
        })
      });

      const result = await response.json();
      if (result.success) {
        loadMonitoredClans();
        setAddClanSearch('');
        setSearchResults([]);
      } else {
        alert(result.error || 'Failed to add clan');
      }
    } catch (error) {
      console.error('Failed to add clan:', error);
      alert('Failed to add clan');
    }
  };

  const removeClanFromMonitoring = async (clanId: number) => {
    if (!confirm('Are you sure you want to remove this clan from monitoring?')) return;

    try {
      const response = await fetch('/api/monitored-clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          clanId
        })
      });

      const result = await response.json();
      if (result.success) {
        loadMonitoredClans();
      } else {
        alert(result.error || 'Failed to remove clan');
      }
    } catch (error) {
      console.error('Failed to remove clan:', error);
      alert('Failed to remove clan');
    }
  };

  const toggleClanEnabled = async (clanId: number, enabled: boolean) => {
    try {
      const response = await fetch('/api/monitored-clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          clanId,
          updates: { enabled }
        })
      });

      const result = await response.json();
      if (result.success) {
        loadMonitoredClans();
      }
    } catch (error) {
      console.error('Failed to toggle clan:', error);
    }
  };

  const runManualCheck = async () => {
    setManualCheckLoading(true);
    setManualCheckResults(null);
    setProgressMessage('Starting manual check...');
    setProgressPercent(0);
    setProgressDetails(null);
    setStatsLoading({});
    setStatsLoaded({});

    try {
      const response = await fetch('/api/monitoring/manual-check', {
        method: 'POST'
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete messages (separated by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim() || !message.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(message.slice(6)); // Remove 'data: ' prefix

            // Update progress based on message type
            switch (data.type) {
              case 'start':
              case 'info':
                setProgressMessage(data.message);
                break;

              case 'clan_start':
                setProgressMessage(data.message);
                if (data.current && data.total) {
                  setProgressPercent((data.current / data.total) * 100);
                  setProgressDetails({
                    current: data.current,
                    total: data.total,
                    type: 'clans'
                  });
                }
                break;

              case 'stats_start':
                setProgressMessage(data.message);
                break;

              case 'stats_progress':
                setProgressMessage(data.message);
                if (data.current !== undefined && data.total) {
                  const statsPercent = (data.current / data.total) * 100;
                  setProgressPercent(statsPercent);
                }
                break;

              case 'clan_complete':
                setProgressMessage(data.message);
                if (data.current && data.total) {
                  setProgressPercent((data.current / data.total) * 100);
                }
                break;

              case 'complete':
                setProgressMessage(data.message);
                setProgressPercent(100);
                setManualCheckResults(data);

                // Collapse all results by default (stats will load on-demand)
                if (data.results) {
                  const expanded: Record<number, boolean> = {};
                  data.results.forEach((r: { clan_id: number }) => {
                    expanded[r.clan_id] = false;
                  });
                  setExpandedResults(expanded);
                }
                break;

              case 'error':
                setProgressMessage('Error: ' + data.error);
                setManualCheckResults(data);
                break;
            }
          } catch (parseError) {
            console.error('Failed to parse progress message:', parseError);
          }
        }
      }

      loadMonitoredClans();
    } catch (error) {
      console.error('Manual check failed:', error);
      setManualCheckResults({
        success: false,
        error: 'Manual check failed'
      });
      setProgressMessage('Manual check failed');
    } finally {
      setManualCheckLoading(false);
    }
  };

  const fetchStatsForClan = async (clanId: number) => {
    if (!manualCheckResults?.results) return;

    const clanResult = manualCheckResults.results.find(r => r.clan_id === clanId);
    if (!clanResult?.leavers || clanResult.leavers.length === 0) return;

    // Check if stats already loaded
    if (statsLoaded[clanId]) return;

    setStatsLoading(prev => ({ ...prev, [clanId]: true }));

    try {
      const accountIds = clanResult.leavers.map(l => l.player.account_id);

      console.log(`[UI] Fetching stats for ${accountIds.length} players from clan ${clanResult.clan_tag}`);

      const response = await fetch('/api/player-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds, region: 'eu' })
      });

      const result = await response.json();

      if (result.success && result.stats) {
        // Update the leavers with fetched stats
        setManualCheckResults(prev => {
          if (!prev?.results) return prev;

          return {
            ...prev,
            results: prev.results.map(r => {
              if (r.clan_id === clanId && r.leavers) {
                return {
                  ...r,
                  leavers: r.leavers.map(leaver => ({
                    ...leaver,
                    stats: result.stats[leaver.player.account_id] || null
                  }))
                };
              }
              return r;
            })
          };
        });

        setStatsLoaded(prev => ({ ...prev, [clanId]: true }));
        console.log(`[UI] Stats loaded for clan ${clanResult.clan_tag}`);
      }
    } catch (error) {
      console.error(`[UI] Failed to fetch stats for clan ${clanId}:`, error);
    } finally {
      setStatsLoading(prev => ({ ...prev, [clanId]: false }));
    }
  };

  const toggleResultExpanded = async (clanId: number) => {
    const wasExpanded = expandedResults[clanId];

    setExpandedResults(prev => ({
      ...prev,
      [clanId]: !prev[clanId]
    }));

    // If expanding and stats not loaded, fetch them
    if (!wasExpanded && !statsLoaded[clanId]) {
      await fetchStatsForClan(clanId);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBulkImportLoading(true);
      setBulkImportResults(null);

      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(worksheet, { header: 1 });

      // Extract clan tags/names from first column (skip header if exists)
      const clanTags: string[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row[0]) {
          const value = String(row[0]).trim();
          // Skip header rows that look like "Clan Name", "Tag", etc.
          if (value && !value.toLowerCase().match(/^(clan|tag|name|guild)s?$/)) {
            clanTags.push(value);
          }
        }
      }

      if (clanTags.length === 0) {
        alert('No valid clan names found in the Excel file. Please ensure clan names are in the first column.');
        return;
      }

      // Confirm with user
      if (!confirm(`Found ${clanTags.length} clan names. Do you want to import them all?`)) {
        return;
      }

      // Call bulk import API
      const response = await fetch('/api/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanTags })
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        alert(`Server error: ${response.status} - ${response.statusText}. Check console for details.`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setBulkImportResults(result);
        loadMonitoredClans(); // Refresh the list
      } else {
        const errorMsg = result.error || 'Bulk import failed';
        console.error('Bulk import error:', result);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Excel import error:', error);
      alert('Failed to process Excel file. Please ensure it is a valid .xlsx or .xls file.');
    } finally {
      setBulkImportLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClans();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [addClanSearch, searchClans]);

  if (loading) {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <TacticalLoader variant="turret" size="lg" color="green" message="Loading Dashboard..." />
      </ModernBackground>
    );
  }

  return (
    <ModernBackground>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Monitoring Dashboard
              </h1>
              <p className="text-text-secondary">
                Multi-clan monitoring and analytics
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={runManualCheck}
                disabled={manualCheckLoading}
                size="lg"
              >
                {manualCheckLoading ? 'Checking...' : 'Run Manual Check'}
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/">
                  ← Back
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        {manualCheckLoading && (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Processing...</h2>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">{progressMessage}</span>
                {progressDetails && (
                  <span className="text-sm text-gray-400">
                    {progressDetails.current} / {progressDetails.total} {progressDetails.type}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-4 transition-all duration-300 ease-out flex items-center justify-center"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 10 && (
                    <span className="text-xs font-medium text-white">
                      {Math.round(progressPercent)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Activity indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Please wait while we check all clans...</span>
            </div>
          </div>
        )}

        {/* Monitored Clans List - Moved to top and made collapsible */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setMonitoredClansExpanded(!monitoredClansExpanded)}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">
                Monitored Clans ({monitoredClans.length})
              </h2>
              <div className="text-sm text-gray-400">
                Active: {monitoredClans.filter(c => c.enabled).length} |
                Inactive: {monitoredClans.filter(c => !c.enabled).length}
              </div>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              {monitoredClansExpanded ? '▼' : '▶'}
            </button>
          </div>

          {monitoredClansExpanded && (
            <div className="mt-4">
              {monitoredClans.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No clans are being monitored. Add some clans below to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Clan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Last Check
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {monitoredClans.map((clan) => (
                        <tr key={clan.clan_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                [{clan.tag}] {clan.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                ID: {clan.clan_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  !clan.enabled
                                    ? 'bg-gray-700 text-gray-400'
                                    : clan.status === 'active'
                                    ? 'bg-green-800 text-green-300'
                                    : clan.status === 'error'
                                    ? 'bg-red-800 text-red-300'
                                    : 'bg-yellow-800 text-yellow-300'
                                }`}
                              >
                                {!clan.enabled ? 'Disabled' : clan.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {clan.last_checked
                              ? new Date(clan.last_checked).toLocaleString()
                              : 'Never'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {clan.last_member_count || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleClanEnabled(clan.clan_id, !clan.enabled)}
                                className={`px-3 py-1 rounded text-xs ${
                                  clan.enabled
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                } text-white`}
                              >
                                {clan.enabled ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => removeClanFromMonitoring(clan.clan_id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk Import from Excel */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Bulk Import from Excel</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-300 mb-3">
                Upload an Excel file (.xlsx or .xls) with clan names or tags in the first column.
                The system will automatically search and add matching clans.
              </p>

              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={bulkImportLoading}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                    bulkImportLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {bulkImportLoading ? 'Processing...' : 'Choose Excel File'}
                </label>
                {bulkImportLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    <span>Importing clans...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Import Results */}
            {bulkImportResults && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{bulkImportResults.total}</div>
                    <div className="text-sm text-gray-400">Total Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{bulkImportResults.successful}</div>
                    <div className="text-sm text-gray-400">Successfully Added</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{bulkImportResults.failed}</div>
                    <div className="text-sm text-gray-400">Failed</div>
                  </div>
                </div>

                {bulkImportResults.results.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Tag</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {bulkImportResults.results.map((result, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-white font-medium">{result.tag}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  result.success
                                    ? 'bg-green-800 text-green-300'
                                    : 'bg-red-800 text-red-300'
                                }`}
                              >
                                {result.success ? 'Added' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-300">
                              {result.success ? (
                                <span>
                                  [{result.tag}] {result.name}
                                </span>
                              ) : (
                                <span className="text-red-400">{result.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setBulkImportResults(null)}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 w-full"
                >
                  Close Results
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add New Clan */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Add Individual Clan to Monitoring</h2>

          <div className="mb-4">
            <input
              type="text"
              value={addClanSearch}
              onChange={(e) => setAddClanSearch(e.target.value)}
              placeholder="Search for clan name or tag"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            {searchLoading && (
              <p className="text-sm text-gray-400 mt-1">Searching...</p>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((clan) => {
                const isAlreadyMonitored = monitoredClans.some(mc => mc.clan_id === clan.clan_id);
                return (
                  <div
                    key={clan.clan_id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
                  >
                    <div>
                      <span className="text-white font-medium">[{clan.tag}] {clan.name}</span>
                      <span className="text-gray-400 text-sm ml-2">ID: {clan.clan_id}</span>
                    </div>
                    {isAlreadyMonitored ? (
                      <span className="text-gray-500">Already monitored</span>
                    ) : (
                      <button
                        onClick={() => addClanToMonitoring(clan)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual Check Results */}
        {manualCheckResults && manualCheckResults.success && (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Manual Check Results
              </h2>
              <button
                onClick={() => setManualCheckResults(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard
                title="Clans Scanned"
                value={manualCheckResults.clans_checked || 0}
                delay={0.1}
              />
              <StatCard
                title="Total Leavers"
                value={manualCheckResults.total_leavers || 0}
                delay={0.2}
              />
              <StatCard
                title="Progress"
                value={100}
                delay={0.3}
                icon={<div className="text-3xl">✓</div>}
              />
            </div>

            {manualCheckResults.results && manualCheckResults.results.length > 0 && (
              <div className="space-y-4">
                {manualCheckResults.results.map((clanResult) => {
                  const isExpanded = expandedResults[clanResult.clan_id] ?? false;

                  return (
                    <div key={clanResult.clan_id} className="bg-gray-700 rounded-lg">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-600 transition-colors rounded-lg"
                        onClick={() => toggleResultExpanded(clanResult.clan_id)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-gray-400 hover:text-white transition-colors">
                            {isExpanded ? '▼' : '▶'}
                          </button>
                          <h3 className="text-lg font-semibold text-white">
                            [{clanResult.clan_tag}] {clanResult.clan_name}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          clanResult.error
                            ? 'bg-red-800 text-red-300'
                            : (clanResult.count || 0) > 0
                            ? 'bg-red-800 text-red-300'
                            : 'bg-green-800 text-green-300'
                        }`}>
                          {clanResult.error
                            ? 'Error'
                            : (clanResult.count || 0) > 0
                            ? `${clanResult.count} player${clanResult.count !== 1 ? 's' : ''} left`
                            : 'No departures'}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4">
                          {clanResult.error && (
                            <p className="text-red-400 text-sm mb-3">{clanResult.error}</p>
                          )}

                          {/* Loading stats indicator */}
                          {statsLoading[clanResult.clan_id] && (
                            <div className="flex items-center gap-3 p-4 bg-blue-900 bg-opacity-30 rounded-lg mb-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                              <span className="text-blue-300">Loading player statistics...</span>
                            </div>
                          )}

                          {clanResult.leavers && clanResult.leavers.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-600">
                                <thead className="bg-gray-800">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                      Player
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                      Left Date
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="60 Days Statistics">
                                      Battles
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="60 Days WN8">
                                      WN8
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="60 Days Win Rate">
                                      Win%
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="60 Days Average Damage">
                                      Avg DMG
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="60 Days K/D Ratio">
                                      K/D
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="60 Days Survival Rate">
                                      Surv%
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-gray-700 divide-y divide-gray-600">
                                  {clanResult.leavers?.map((leaver, index) => (
                                    <tr key={index} className="hover:bg-gray-600">
                                      <td className="px-3 py-3 text-sm">
                                        <div className="text-white font-medium">{leaver.player.account_name}</div>
                                        <div className="text-gray-400 text-xs">{leaver.player.account_id}</div>
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">
                                        <div>{leaver.date}</div>
                                        <div className="text-xs text-gray-400">
                                          {new Date(leaver.timestamp * 1000).toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      </td>
                                      {leaver.stats ? (
                                        <>
                                          <td className="px-3 py-3 text-center text-sm text-gray-300">
                                            {leaver.stats.battles}
                                          </td>
                                          <td className={`px-3 py-3 text-center text-sm font-semibold ${getWN8Color(leaver.stats.wn8)}`}>
                                            {Math.round(leaver.stats.wn8)}
                                          </td>
                                          <td className="px-3 py-3 text-center text-sm text-gray-300">
                                            {leaver.stats.winrate.toFixed(2)}%
                                          </td>
                                          <td className="px-3 py-3 text-center text-sm text-gray-300">
                                            {Math.round(leaver.stats.avgDamage)}
                                          </td>
                                          <td className="px-3 py-3 text-center text-sm text-gray-300">
                                            {leaver.stats.kdRatio.toFixed(2)}
                                          </td>
                                          <td className="px-3 py-3 text-center text-sm text-gray-300">
                                            {leaver.stats.survivalRate.toFixed(2)}%
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td colSpan={6} className="px-3 py-3 text-center text-sm text-gray-500 italic">
                                            Stats unavailable
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ModernBackground>
  );
}