'use client';

import type { ManualCheckResults, ClanCheckResult } from '@/hooks/use-manual-check';
import { getWN8Color } from '@/lib/tomato-api';
import { StatCard } from '@/components/ui/stat-card';

interface ManualCheckResultsViewProps {
  results: ManualCheckResults;
  expandedResults: Record<number, boolean>;
  statsLoading: Record<number, boolean>;
  onToggleExpanded: (clanId: number) => void;
  onClose: () => void;
}

export function ManualCheckResultsView({
  results, expandedResults, statsLoading, onToggleExpanded, onClose
}: ManualCheckResultsViewProps) {
  if (!results.success) return null;

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Manual Check Results</h2>
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Close</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Clans Scanned" value={results.clans_checked || 0} delay={0.1} />
        <StatCard title="Total Leavers" value={results.total_leavers || 0} delay={0.2} />
        <StatCard title="Progress" value={100} delay={0.3} icon={<div className="text-3xl">✓</div>} />
      </div>

      {results.results && results.results.length > 0 && (
        <div className="space-y-4">
          {results.results.map((clanResult) => (
            <ClanResultCard
              key={clanResult.clan_id}
              clanResult={clanResult}
              isExpanded={expandedResults[clanResult.clan_id] ?? false}
              isStatsLoading={statsLoading[clanResult.clan_id] ?? false}
              onToggle={() => onToggleExpanded(clanResult.clan_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClanResultCard({
  clanResult, isExpanded, isStatsLoading, onToggle
}: {
  clanResult: ClanCheckResult;
  isExpanded: boolean;
  isStatsLoading: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-600 transition-colors rounded-lg" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white transition-colors">{isExpanded ? '▼' : '▶'}</button>
          <h3 className="text-lg font-semibold text-white">[{clanResult.clan_tag}] {clanResult.clan_name}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          clanResult.error ? 'bg-red-800 text-red-300'
          : (clanResult.count || 0) > 0 ? 'bg-red-800 text-red-300'
          : 'bg-green-800 text-green-300'
        }`}>
          {clanResult.error ? 'Error' : (clanResult.count || 0) > 0 ? `${clanResult.count} player${clanResult.count !== 1 ? 's' : ''} left` : 'No departures'}
        </span>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {clanResult.error && <p className="text-red-400 text-sm mb-3">{clanResult.error}</p>}

          {isStatsLoading && (
            <div className="flex items-center gap-3 p-4 bg-blue-900 bg-opacity-30 rounded-lg mb-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              <span className="text-blue-300">Loading player statistics...</span>
            </div>
          )}

          {clanResult.leavers && clanResult.leavers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Left Date</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="Battles in last 60 days">Battles (60d)</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="WN8 rating in last 60 days">WN8 (60d)</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="Win rate in last 60 days">Win% (60d)</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="Average damage in last 60 days">Avg DMG (60d)</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="Kill/Death ratio in last 60 days">K/D (60d)</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider" title="Survival rate in last 60 days">Surv% (60d)</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {clanResult.leavers.map((leaver, index) => (
                    <tr key={index} className="hover:bg-gray-600">
                      <td className="px-3 py-3 text-sm">
                        <a href={`https://tomato.gg/stats/${encodeURIComponent(leaver.player.account_name)}-${leaver.player.account_id}/EU`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 font-medium underline decoration-transparent hover:decoration-cyan-300 transition-colors">
                          {leaver.player.account_name}
                        </a>
                        <div className="text-gray-400 text-xs">{leaver.player.account_id}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">
                        <div>{leaver.date}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(leaver.timestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      {leaver.stats ? (
                        <>
                          <td className="px-3 py-3 text-center text-sm text-gray-300">{leaver.stats.battles}</td>
                          <td className={`px-3 py-3 text-center text-sm font-semibold ${getWN8Color(leaver.stats.wn8)}`}>{Math.round(leaver.stats.wn8)}</td>
                          <td className="px-3 py-3 text-center text-sm text-gray-300">{leaver.stats.winrate.toFixed(2)}%</td>
                          <td className="px-3 py-3 text-center text-sm text-gray-300">{Math.round(leaver.stats.avgDamage)}</td>
                          <td className="px-3 py-3 text-center text-sm text-gray-300">{leaver.stats.kdRatio.toFixed(2)}</td>
                          <td className="px-3 py-3 text-center text-sm text-gray-300">{leaver.stats.survivalRate.toFixed(2)}%</td>
                        </>
                      ) : (
                        <td colSpan={6} className="px-3 py-3 text-center text-sm text-gray-500 italic">Stats unavailable</td>
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
}
