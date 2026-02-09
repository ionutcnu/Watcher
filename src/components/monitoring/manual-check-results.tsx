'use client';

import type { ManualCheckResults, ClanCheckResult } from '@/hooks/use-manual-check';
import { getWN8Color } from '@/lib/wn8-colors';
import { StatCard } from '@/components/ui/stat-card';
import { BattleReport } from '@/components/monitoring/battle-report';

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
    <div className="bg-surface rounded-lg shadow-md p-6 mb-8 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-text-primary">Manual Check Results</h2>
        <button onClick={onClose} className="px-4 py-2 bg-surface-elevated text-text-primary rounded-md hover:bg-border border border-border">Close</button>
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
    <div className="bg-surface-elevated rounded-lg">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-border/30 transition-colors rounded-lg" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <button className="text-text-secondary hover:text-text-primary transition-colors">{isExpanded ? '▼' : '▶'}</button>
          <h3 className="text-lg font-semibold text-text-primary">[{clanResult.clan_tag}] {clanResult.clan_name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {clanResult.error ? (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-800 text-red-300">Error</span>
          ) : (
            <>
              {(clanResult.joiners?.length || 0) > 0 && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-800 text-green-300">
                  {clanResult.joiners!.length} player{clanResult.joiners!.length !== 1 ? 's' : ''} joined
                </span>
              )}
              {(clanResult.count || 0) > 0 ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-800 text-red-300">
                  {clanResult.count} player{clanResult.count !== 1 ? 's' : ''} left
                </span>
              ) : !clanResult.joiners?.length && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-800 text-green-300">No changes</span>
              )}
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {clanResult.error && <p className="text-red-400 text-sm mb-3">{clanResult.error}</p>}

          {(clanResult.leavers && clanResult.leavers.length > 0) || (clanResult.joiners && clanResult.joiners.length > 0) ? (
            <>
              {/* Battle Report view */}
              <BattleReport
                clanTag={clanResult.clan_tag}
                clanName={clanResult.clan_name}
                joined={(clanResult.joiners || []).map(j => ({
                  account_id: j.player.account_id,
                  account_name: j.player.account_name,
                  stats: j.stats,
                }))}
                left={(clanResult.leavers || []).map(l => ({
                  account_id: l.player.account_id,
                  account_name: l.player.account_name,
                  stats: l.stats,
                }))}
                isStatsLoading={isStatsLoading}
              />

              {/* Detailed stats table (expandable) */}
              {clanResult.leavers && clanResult.leavers.some(l => l.stats) && (
                <details className="mt-4">
                  <summary className="text-text-secondary text-sm cursor-pointer hover:text-text-primary transition-colors">
                    Detailed Statistics
                  </summary>
                  <div className="overflow-x-auto mt-3">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-surface">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Player</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Left Date</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Battles (60d)</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">WN8 (60d)</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Win% (60d)</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Avg DMG (60d)</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">K/D (60d)</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Surv% (60d)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface-elevated divide-y divide-border">
                        {clanResult.leavers.map((leaver, index) => (
                          <tr key={index} className="hover:bg-border/30">
                            <td className="px-3 py-3 text-sm">
                              <a href={`https://tomato.gg/stats/${encodeURIComponent(leaver.player.account_name)}-${leaver.player.account_id}/EU`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                                {leaver.player.account_name}
                              </a>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-text-secondary">
                              <div>{leaver.date}</div>
                              <div className="text-xs text-text-tertiary">
                                {new Date(leaver.timestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            {leaver.stats ? (
                              <>
                                <td className="px-3 py-3 text-center text-sm text-text-secondary">{leaver.stats.battles}</td>
                                <td className={`px-3 py-3 text-center text-sm font-semibold ${getWN8Color(leaver.stats.wn8)}`}>{Math.round(leaver.stats.wn8)}</td>
                                <td className="px-3 py-3 text-center text-sm text-text-secondary">{leaver.stats.winrate.toFixed(2)}%</td>
                                <td className="px-3 py-3 text-center text-sm text-text-secondary">{Math.round(leaver.stats.avgDamage)}</td>
                                <td className="px-3 py-3 text-center text-sm text-text-secondary">{leaver.stats.kdRatio.toFixed(2)}</td>
                                <td className="px-3 py-3 text-center text-sm text-text-secondary">{leaver.stats.survivalRate.toFixed(2)}%</td>
                              </>
                            ) : (
                              <td colSpan={6} className="px-3 py-3 text-center text-sm text-text-tertiary italic">Stats unavailable</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
