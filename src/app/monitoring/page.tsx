'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { MonitoredClan } from '@/types/monitoring';
import { useSession } from '@/lib/auth-client';
import { useManualCheck } from '@/hooks/use-manual-check';
import { useBulkImport } from '@/hooks/use-bulk-import';
import { ModernBackground } from '@/components/ui/modern-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitoringSkeleton } from '@/components/monitoring/monitoring-skeleton';
import { motion } from 'framer-motion';
import { MonitoredClansTable } from '@/components/monitoring/monitored-clans-table';
import { BulkImportPanel } from '@/components/monitoring/bulk-import-panel';
import { ManualCheckProgress } from '@/components/monitoring/manual-check-progress';
import { ManualCheckResultsView } from '@/components/monitoring/manual-check-results';
import { AddClanPanel } from '@/components/monitoring/add-clan-panel';
import { ClanComparison } from '@/components/monitoring/clan-comparison';

export default function MonitoringPage() {
  const { data: session, isPending } = useSession();
  const [monitoredClans, setMonitoredClans] = useState<MonitoredClan[]>([]);
  const [loading, setLoading] = useState(true);
  const [addClanSearch, setAddClanSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ clan_id: number; tag: string; name: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [monitoredClansExpanded, setMonitoredClansExpanded] = useState(true);
  const [selectedClans, setSelectedClans] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [clanRatings, setClanRatings] = useState<Record<number, number | null>>({});

  const loadMonitoredClans = async () => {
    try {
      const response = await fetch('/api/monitored-clans');
      const result = await response.json();
      if (result.success) {
        setMonitoredClans(result.clans);
        // Fetch ratings for all monitored clans
        if (result.clans.length > 0) {
          const ids = result.clans.map((c: MonitoredClan) => c.clan_id).join(',');
          fetch(`/api/clan-ratings?clan_ids=${ids}`)
            .then(r => r.json())
            .then(r => { if (r.success) setClanRatings(r.ratings); })
            .catch(() => {});
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const manualCheck = useManualCheck(loadMonitoredClans);
  const bulkImport = useBulkImport(loadMonitoredClans);

  useEffect(() => { loadMonitoredClans(); }, []);

  const searchClans = useCallback(async () => {
    if (!addClanSearch.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search-clans?search=${encodeURIComponent(addClanSearch)}`);
      const result = await response.json();
      setSearchResults(result.clans || []);
    } catch { setSearchResults([]); } finally { setSearchLoading(false); }
  }, [addClanSearch]);

  const addClanToMonitoring = async (clan: { clan_id: number; tag: string; name: string }) => {
    try {
      const response = await fetch('/api/monitored-clans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', clan_id: clan.clan_id, tag: clan.tag, name: clan.name, enabled: true })
      });
      const result = await response.json();
      if (result.success) { loadMonitoredClans(); setAddClanSearch(''); setSearchResults([]); toast.success('Clan added to monitoring'); }
      else toast.error(result.error || 'Failed to add clan');
    } catch { toast.error('Failed to add clan'); }
  };

  const removeClanFromMonitoring = async (clanId: number) => {
    if (!confirm('Are you sure you want to remove this clan from monitoring?')) return;
    try {
      const response = await fetch('/api/monitored-clans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', clanId })
      });
      const result = await response.json();
      if (result.success) { loadMonitoredClans(); toast.success('Clan removed from monitoring'); }
      else toast.error(result.error || 'Failed to remove clan');
    } catch { toast.error('Failed to remove clan'); }
  };

  const toggleClanEnabled = async (clanId: number, enabled: boolean, skipReload = false) => {
    try {
      const response = await fetch('/api/monitored-clans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', clanId, updates: { enabled } })
      });
      const result = await response.json();
      if (result.success && !skipReload) loadMonitoredClans();
    } catch { /* ignore */ }
  };

  const toggleSelectAll = () => {
    setSelectedClans(selectedClans.size === monitoredClans.length ? new Set() : new Set(monitoredClans.map(c => c.clan_id)));
  };

  const toggleSelectClan = (clanId: number) => {
    const next = new Set(selectedClans);
    if (next.has(clanId)) next.delete(clanId); else next.add(clanId);
    setSelectedClans(next);
  };

  const bulkOperation = async (op: 'enable' | 'disable' | 'remove') => {
    if (selectedClans.size === 0) return;
    const label = op === 'remove' ? 'Remove' : op === 'enable' ? 'Enable' : 'Disable';
    if (!confirm(`${label} ${selectedClans.size} selected clans?`)) return;

    setBulkActionLoading(true);
    try {
      for (const clanId of selectedClans) {
        if (op === 'remove') {
          await fetch('/api/monitored-clans', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', clanId })
          });
        } else {
          // Skip individual reloads in bulk operations
          await toggleClanEnabled(clanId, op === 'enable', true);
        }
      }
      const count = selectedClans.size;
      setSelectedClans(new Set());
      // Reload once after all operations complete
      loadMonitoredClans();
      toast.success(`Successfully ${op === 'remove' ? 'removed' : op === 'enable' ? 'enabled' : 'disabled'} ${count} clans`);
    } catch { toast.error(`Some clans failed to ${op}`); } finally { setBulkActionLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchClans(), 300);
    return () => clearTimeout(t);
  }, [addClanSearch, searchClans]);

  if (isPending || loading) {
    return (
      <ModernBackground>
        <MonitoringSkeleton />
      </ModernBackground>
    );
  }

  if (!session?.user) {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader><CardTitle className="text-2xl text-center">Authentication Required</CardTitle></CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-text-secondary">You need to be signed in to access the monitoring dashboard.</p>
            <p className="text-text-tertiary text-sm">Sign in using the header above to view and manage your monitored clans.</p>
            <Button asChild className="w-full"><Link href="/">Go to Home Page</Link></Button>
          </CardContent>
        </Card>
      </ModernBackground>
    );
  }

  return (
    <ModernBackground>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Monitoring Dashboard</h1>
              <p className="text-text-secondary">Multi-clan monitoring and analytics</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={manualCheck.runManualCheck} disabled={manualCheck.loading} size="lg">
                {manualCheck.loading ? 'Checking...' : 'Run Manual Check'}
              </Button>
              <Button asChild variant="secondary" size="lg"><Link href="/">← Back</Link></Button>
            </div>
          </div>
        </motion.div>

        {manualCheck.loading && (
          <ManualCheckProgress
            message={manualCheck.progressMessage}
            percent={manualCheck.progressPercent}
            details={manualCheck.progressDetails}
          />
        )}

        <MonitoredClansTable
          clans={monitoredClans}
          clanRatings={clanRatings}
          expanded={monitoredClansExpanded}
          onToggleExpanded={() => setMonitoredClansExpanded(!monitoredClansExpanded)}
          selectedClans={selectedClans}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectClan={toggleSelectClan}
          onToggleEnabled={toggleClanEnabled}
          onRemove={removeClanFromMonitoring}
          onBulkEnable={() => bulkOperation('enable')}
          onBulkDisable={() => bulkOperation('disable')}
          onBulkRemove={() => bulkOperation('remove')}
          bulkActionLoading={bulkActionLoading}
        />

        <ClanComparison clans={monitoredClans} clanRatings={clanRatings} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AddClanPanel
            searchQuery={addClanSearch}
            onSearchChange={setAddClanSearch}
            searchLoading={searchLoading}
            searchResults={searchResults}
            monitoredClans={monitoredClans}
            onAddClan={addClanToMonitoring}
          />

          <BulkImportPanel
            loading={bulkImport.loading}
            results={bulkImport.results}
            fileInputRef={bulkImport.fileInputRef}
            onFileUpload={bulkImport.handleFileUpload}
            onClearResults={bulkImport.clearResults}
          />
        </div>

        {manualCheck.results && manualCheck.results.success && (
          <ManualCheckResultsView
            results={manualCheck.results}
            expandedResults={manualCheck.expandedResults}
            statsLoading={manualCheck.statsLoading}
            onToggleExpanded={manualCheck.toggleResultExpanded}
            onClose={manualCheck.clearResults}
          />
        )}
      </div>
    </ModernBackground>
  );
}
