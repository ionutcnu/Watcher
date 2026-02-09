'use client';

import { Eye } from 'lucide-react';
import { MonitoredClan } from '@/types/monitoring';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getClanRatingColor } from '@/lib/clan-rating';

interface MonitoredClansTableProps {
  clans: MonitoredClan[];
  clanRatings?: Record<number, number | null>;
  expanded: boolean;
  onToggleExpanded: () => void;
  selectedClans: Set<number>;
  onToggleSelectAll: () => void;
  onToggleSelectClan: (clanId: number) => void;
  onToggleEnabled: (clanId: number, enabled: boolean) => void;
  onRemove: (clanId: number) => void;
  onBulkEnable: () => void;
  onBulkDisable: () => void;
  onBulkRemove: () => void;
  bulkActionLoading: boolean;
}

export function MonitoredClansTable({
  clans, clanRatings, expanded, onToggleExpanded,
  selectedClans, onToggleSelectAll, onToggleSelectClan,
  onToggleEnabled, onRemove,
  onBulkEnable, onBulkDisable, onBulkRemove, bulkActionLoading
}: MonitoredClansTableProps) {
  return (
    <div className="bg-surface rounded-lg shadow-md p-6 mb-8 border border-border">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-text-primary">Monitored Clans ({clans.length})</h2>
          <div className="text-sm text-text-secondary">
            Active: {clans.filter(c => c.enabled).length} | Inactive: {clans.filter(c => !c.enabled).length}
          </div>
        </div>
        <button className="text-text-secondary hover:text-text-primary transition-colors">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {clans.length === 0 ? (
            <EmptyState
              icon={<Eye className="w-6 h-6" />}
              title="No monitored clans"
              description="Add clans to start tracking member changes and receive notifications."
            />
          ) : (
            <>
              {selectedClans.size > 0 && (
                <div className="mb-4 p-4 bg-surface-elevated rounded-lg flex items-center justify-between">
                  <div className="text-text-primary">{selectedClans.size} clan{selectedClans.size !== 1 ? 's' : ''} selected</div>
                  <div className="flex gap-2">
                    <Button onClick={onBulkEnable} disabled={bulkActionLoading} size="sm" variant="default">Enable Selected</Button>
                    <Button onClick={onBulkDisable} disabled={bulkActionLoading} size="sm" variant="secondary">Disable Selected</Button>
                    <Button onClick={onBulkRemove} disabled={bulkActionLoading} size="sm" variant="destructive">Remove Selected</Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input type="checkbox" checked={selectedClans.size === clans.length && clans.length > 0} onChange={onToggleSelectAll}
                          className="w-4 h-4 rounded border-border bg-surface text-accent-primary focus:ring-accent-primary" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Clan</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Last Check</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Members</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-border">
                    {clans.map((clan) => (
                      <tr key={clan.clan_id} className={selectedClans.has(clan.clan_id) ? 'bg-surface-elevated' : ''}>
                        <td className="px-3 py-4">
                          <input type="checkbox" checked={selectedClans.has(clan.clan_id)} onChange={() => onToggleSelectClan(clan.clan_id)}
                            className="w-4 h-4 rounded border-border bg-surface text-accent-primary focus:ring-accent-primary" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">[{clan.tag}] {clan.name}</div>
                          <div className="text-sm text-text-secondary">ID: {clan.clan_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {clanRatings?.[clan.clan_id] != null && !isNaN(clanRatings[clan.clan_id]!) ? (
                            <span className={`font-mono font-bold text-sm ${getClanRatingColor(clanRatings[clan.clan_id]!)}`}>
                              {Math.round(clanRatings[clan.clan_id]!).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-text-tertiary text-xs">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            !clan.enabled ? 'bg-surface-elevated text-text-tertiary'
                            : clan.status === 'active' ? 'bg-green-800 text-green-300'
                            : clan.status === 'error' ? 'bg-red-800 text-red-300'
                            : 'bg-yellow-800 text-yellow-300'
                          }`}>
                            {!clan.enabled ? 'Disabled' : clan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {clan.last_checked ? new Date(clan.last_checked).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{clan.last_member_count || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          <div className="flex items-center gap-2">
                            <button onClick={() => onToggleEnabled(clan.clan_id, !clan.enabled)}
                              className={`px-3 py-1 rounded text-xs ${clan.enabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                              {clan.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => onRemove(clan.clan_id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
