'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClanChange } from '@/types/clan';
import { useClanHistory } from '@/hooks/use-clan-history';
import { ModernBackground } from '@/components/ui/modern-background';
import { Button } from '@/components/ui/button';
import { motion, useReducedMotion } from 'framer-motion';
import { ClanSearchPanel } from '@/components/home/clan-search-panel';
import { ScanResultsPanel } from '@/components/home/scan-results-panel';
import { ClanHistoryPanel } from '@/components/home/clan-history-panel';
import { RecentChangesPanel } from '@/components/home/recent-changes-panel';
import { FeaturesSection } from '@/components/home/features-section';
import { StatusBadge } from '@/components/ui/status-badge';
import { SparkCanvas } from '@/components/ui/spark-canvas';
import { VideoSmoke } from '@/components/ui/video-smoke';

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
  const shouldReduceMotion = useReducedMotion();
  const [stats, setStats] = useState<{ clansTracked: number; changesThisMonth: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d); })
      .catch(() => {});
  }, []);

  // Sync search query to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (clanSearch.trim()) {
      params.set('q', clanSearch);
    } else {
      params.delete('q');
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [clanSearch]);

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
      setScanResult(prev => prev && prev.summary ? { ...prev, summary: { ...prev.summary, joins, leaves } } : prev);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.allEvents.length]);

  return (
    <ModernBackground>
      {/* Video Smoke Effect from Bottom */}
      <VideoSmoke />

      {/* Canvas-Based Spark Particles */}
      <SparkCanvas />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }}
          animate={shouldReduceMotion ? {} : { y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-6 flex justify-center">
            <StatusBadge />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight" style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            <span className="text-white">World of Tanks </span>
            <span className="text-[#FF8C00]">Clan Watcher</span>
          </h1>
          <p className="text-base text-[#c1c1c1] mb-8 max-w-2xl mx-auto leading-relaxed">
            Professional clan intelligence and member tracking
          </p>
          <Button
            asChild
            size="lg"
            className="text-base font-bold border border-[rgba(255,255,255,0.2)] bg-gradient-to-b from-[#FF8C00] to-[#CC5500] hover:brightness-120 shadow-[0_4px_15px_rgba(255,140,0,0.3)] hover:shadow-[0_0_20px_#FF8C00] rounded-lg px-8 text-white uppercase transition-all duration-300"
          >
            <a href="/monitoring">View Dashboard →</a>
          </Button>

          {/* Hero Stats */}
          <div aria-live="polite" aria-atomic="true" className="flex gap-8 md:gap-16 justify-center mt-12 pt-8 border-t border-[#3f3f46]">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#10b981] to-[#059669] bg-clip-text text-transparent" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {stats ? stats.clansTracked.toLocaleString() : '—'}
              </div>
              <div className="text-sm text-[#a1a1aa] uppercase tracking-wide mt-1">Clans Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#10b981] to-[#059669] bg-clip-text text-transparent" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {stats ? stats.changesThisMonth.toLocaleString() : '—'}
              </div>
              <div className="text-sm text-[#a1a1aa] uppercase tracking-wide mt-1">Changes This Month</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 mb-8 items-start">
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

          <RecentChangesPanel
            recentChanges={recentChanges}
            lastScannedClan={lastScannedClan}
            onExport={() => history.exportToCSV(recentChanges)}
            hasExportData={recentChanges.length > 0 || history.allEvents.length > 0}
          />
        </div>

        {/* Features Section */}
        {!scanResult && !history.showHistory && <FeaturesSection />}

        <div aria-live="polite">
          {scanResult && <ScanResultsPanel scanResult={scanResult} />}
        </div>

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
      </div>
    </ModernBackground>
  );
}
