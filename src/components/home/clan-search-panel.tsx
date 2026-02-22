'use client';

import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TacticalLoader } from '@/components/ui/tactical-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { motion, useReducedMotion } from 'framer-motion';

interface ClanSearchPanelProps {
  clanSearch: string;
  setClanSearch: (v: string) => void;
  searchResults: Array<{ clan_id: number; tag: string; name: string }>;
  searchLoading: boolean;
  selectedClan: { clan_id: number; tag: string; name: string } | null;
  setSelectedClan: (clan: { clan_id: number; tag: string; name: string }) => void;
  onScan: () => void;
  onHistory: () => void;
  loading: boolean;
  historyLoading: boolean;
  error: string | null;
}

export function ClanSearchPanel({
  clanSearch, setClanSearch, searchResults, searchLoading,
  selectedClan, setSelectedClan, onScan, onHistory,
  loading, historyLoading, error
}: ClanSearchPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <Card variant="bracket" className="mb-8 overflow-visible">
      <CardHeader>
        <CardTitle>Search & Scan Clan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="clan-search">Search Clans</Label>
          <Input
            id="clan-search"
            type="text"
            name="clan-search"
            autoComplete="off"
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

        {!searchLoading && clanSearch.trim().length > 0 && searchResults.length === 0 && (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="No clans found"
            description="No clans matched your search. Try a different name or tag."
            className="py-6"
          />
        )}

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <Label>Search Results</Label>
            <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-2">
              {searchResults.map((clan) => (
                <motion.div
                  key={clan.clan_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedClan(clan)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedClan(clan); } }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
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

            {selectedClan && (
              <div className="flex gap-2 pt-2">
                <Button onClick={onScan} disabled={loading} size="lg" className="flex-1">
                  {loading ? 'Scanning...' : 'Scan Now'}
                </Button>
                <Button onClick={onHistory} disabled={historyLoading} variant="secondary" size="lg" className="flex-1">
                  {historyLoading ? 'Loading...' : 'History'}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-danger/10 border border-danger rounded-md">
            <p className="text-danger text-sm font-medium">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
