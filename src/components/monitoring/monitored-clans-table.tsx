'use client';

import { MonitoredClan } from '@/types/monitoring';
import { Button } from '@/components/ui/button';

interface MonitoredClansTableProps {
  clans: MonitoredClan[];
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
  clans, expanded, onToggleExpanded,
  selectedClans, onToggleSelectAll, onToggleSelectClan,
  onToggleEnabled, onRemove,
  onBulkEnable, onBulkDisable, onBulkRemove, bulkActionLoading
}: MonitoredClansTableProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Monitored Clans ({clans.length})</h2>
          <div className="text-sm text-gray-400">
            Active: {clans.filter(c => c.enabled).length} | Inactive: {clans.filter(c => !c.enabled).length}
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {clans.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No clans are being monitored. Add some clans below to get started.</p>
          ) : (
            <>
              {selectedClans.size > 0 && (
                <div className="mb-4 p-4 bg-gray-700 rounded-lg flex items-center justify-between">
                  <div className="text-white">{selectedClans.size} clan{selectedClans.size !== 1 ? 's' : ''} selected</div>
                  <div className="flex gap-2">
                    <Button onClick={onBulkEnable} disabled={bulkActionLoading} size="sm" variant="default">Enable Selected</Button>
                    <Button onClick={onBulkDisable} disabled={bulkActionLoading} size="sm" variant="secondary">Disable Selected</Button>
                    <Button onClick={onBulkRemove} disabled={bulkActionLoading} size="sm" variant="destructive">Remove Selected</Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input type="checkbox" checked={selectedClans.size === clans.length && clans.length > 0} onChange={onToggleSelectAll}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Clan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Check</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Members</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {clans.map((clan) => (
                      <tr key={clan.clan_id} className={selectedClans.has(clan.clan_id) ? 'bg-gray-700' : ''}>
                        <td className="px-3 py-4">
                          <input type="checkbox" checked={selectedClans.has(clan.clan_id)} onChange={() => onToggleSelectClan(clan.clan_id)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">[{clan.tag}] {clan.name}</div>
                          <div className="text-sm text-gray-400">ID: {clan.clan_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            !clan.enabled ? 'bg-gray-700 text-gray-400'
                            : clan.status === 'active' ? 'bg-green-800 text-green-300'
                            : clan.status === 'error' ? 'bg-red-800 text-red-300'
                            : 'bg-yellow-800 text-yellow-300'
                          }`}>
                            {!clan.enabled ? 'Disabled' : clan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {clan.last_checked ? new Date(clan.last_checked).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{clan.last_member_count || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
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
