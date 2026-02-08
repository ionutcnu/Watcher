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
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-white">Add Individual Clan to Monitoring</h2>
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for clan name or tag"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
        {searchLoading && <p className="text-sm text-gray-400 mt-1">Searching...</p>}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((clan) => {
            const isAlreadyMonitored = monitoredClans.some(mc => mc.clan_id === clan.clan_id);
            return (
              <div key={clan.clan_id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <div>
                  <span className="text-white font-medium">[{clan.tag}] {clan.name}</span>
                  <span className="text-gray-400 text-sm ml-2">ID: {clan.clan_id}</span>
                </div>
                {isAlreadyMonitored ? (
                  <span className="text-gray-500">Already monitored</span>
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
