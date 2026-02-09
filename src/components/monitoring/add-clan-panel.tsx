'use client';

import { MonitoredClan } from '@/types/monitoring';

interface AddClanPanelProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  searchLoading: boolean;
  searchResults: Array<{ clan_id: number; tag: string; name: string }>;
  monitoredClans: MonitoredClan[];
  onAddClan: (clan: { clan_id: number; tag: string; name: string }) => void;
}

export function AddClanPanel({
  searchQuery, onSearchChange, searchLoading, searchResults, monitoredClans, onAddClan
}: AddClanPanelProps) {
  return (
    <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Add Individual Clan to Monitoring</h2>
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for clan name or tag"
          className="w-full px-3 py-2 bg-surface-elevated border border-border text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary placeholder-text-tertiary"
        />
        {searchLoading && <p className="text-sm text-text-secondary mt-1">Searching...</p>}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((clan) => {
            const isAlreadyMonitored = monitoredClans.some(mc => mc.clan_id === clan.clan_id);
            return (
              <div key={clan.clan_id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-md">
                <div>
                  <span className="text-text-primary font-medium">[{clan.tag}] {clan.name}</span>
                  <span className="text-text-secondary text-sm ml-2">ID: {clan.clan_id}</span>
                </div>
                {isAlreadyMonitored ? (
                  <span className="text-text-tertiary">Already monitored</span>
                ) : (
                  <button onClick={() => onAddClan(clan)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
