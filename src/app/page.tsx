'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClanChange } from '@/types/clan';
import { useClanHistory } from '@/hooks/use-clan-history';
import { ModernBackground } from '@/components/ui/modern-background';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ClanSearchPanel } from '@/components/home/clan-search-panel';
import { ScanResultsPanel } from '@/components/home/scan-results-panel';
import { ClanHistoryPanel } from '@/components/home/clan-history-panel';
import { RecentChangesPanel } from '@/components/home/recent-changes-panel';

interface ScanResult {
  success: boolean;
  clan?: {
    clan_id: number;
    tag: string;
    name: string;
    members: Array<{ account_id: number; account_name: string; joined_at: number; role: string }>;
  };
  changes?: ClanChange[];
  summary?: { total_members: number; joins: number; leaves: number };
}

export default function Home() {
  const [clanSearch, setClanSearch] = useState('');
  const [selectedClan, setSelectedClan] = useState<{ clan_id: number; tag: string; name: string } | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ clan_id: number; tag: string; name: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentChanges, setRecentChanges] = useState<ClanChange[]>([]);
  const [lastScannedClan, setLastScannedClan] = useState<{ clan_id: number; tag: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useClanHistory({ selectedClan });

  const searchClans = useCallback(async () => {
    if (!clanSearch.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search-clans?search=${encodeURIComponent(clanSearch)}`);
      const result = await response.json();
      setSearchResults(result.clans || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [clanSearch]);

  const scanClan = async () => {
    if (!selectedClan) { setError('Please select a clan first'); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scan-clan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: selectedClan.clan_id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Scan failed');

      setScanResult(result);
      setLastScannedClan(selectedClan);
      loadRecentChanges();
      if (!result.changes || result.changes.length === 0) history.loadClanHistory();
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
    } catch { /* ignore */ }
  };

  useEffect(() => { loadRecentChanges(); }, []);

  useEffect(() => {
    const t = setTimeout(() => searchClans(), 300);
    return () => clearTimeout(t);
  }, [clanSearch, searchClans]);

  // Update scan result summary with history counts
  useEffect(() => {
    if (history.allEvents.length > 0 && scanResult) {
      const joins = history.allEvents.filter(e => e.type === 'join').length;
      const leaves = history.allEvents.filter(e => e.type === 'leave').length;
      setScanResult(prev => prev ? { ...prev, summary: { ...prev.summary!, joins, leaves } } : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.allEvents.length]);

  return (
    <ModernBackground>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
            <a href="/monitoring">View Dashboard →</a>
          </Button>
        </motion.div>

        <ClanSearchPanel
          clanSearch={clanSearch}
          setClanSearch={setClanSearch}
          searchResults={searchResults}
          searchLoading={searchLoading}
          selectedClan={selectedClan}
          setSelectedClan={setSelectedClan}
          onScan={scanClan}
          onHistory={history.loadClanHistory}
          loading={loading}
          historyLoading={history.historyLoading}
          error={error}
        />

        {scanResult && <ScanResultsPanel scanResult={scanResult} />}

        {history.showHistory && (
          <ClanHistoryPanel
            selectedClan={selectedClan}
            allEvents={history.allEvents}
            filteredEvents={history.filteredEvents}
            eventLimit={history.eventLimit}
            setEventLimit={history.setEventLimit}
            eventTypeFilter={history.eventTypeFilter}
            setEventTypeFilter={history.setEventTypeFilter}
            onClose={() => history.setShowHistory(false)}
          />
        )}

        <RecentChangesPanel
          recentChanges={recentChanges}
          lastScannedClan={lastScannedClan}
          onExport={() => history.exportToCSV(recentChanges)}
          hasExportData={recentChanges.length > 0 || history.allEvents.length > 0}
        />
      </div>
    </ModernBackground>
  );
}
