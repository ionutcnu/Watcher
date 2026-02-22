'use client';

import { ExternalLink, X } from 'lucide-react';
import { getWN8Color, getWN8BgColor } from '@/lib/wn8-colors';
import { PlayerCardTooltip } from '@/components/ui/player-card-tooltip';
import { openPlayerJourney } from '@/components/ui/player-journey-timeline';
import type { TomatoPlayerStats } from '@/types/player-stats';

interface BattleReportPlayer {
  account_id: number;
  account_name: string;
  stats?: TomatoPlayerStats | null;
  date?: string;
  time?: string;
  /** For left-column players: the clan they moved to */
  destinationTag?: string;
  destinationName?: string;
  /** For joined-column players: the clan they came from */
  sourceTag?: string;
  sourceName?: string;
}

interface BattleReportProps {
  clanTag: string;
  clanName: string;
  timestamp?: string;
  joined: BattleReportPlayer[];
  left: BattleReportPlayer[];
  isStatsLoading?: boolean;
  /** account_id → current clan tag (null = clanless, undefined = not yet fetched) */
  currentClans?: Record<number, string | null>;
}

export function BattleReport({
  clanTag, clanName, timestamp, joined, left, isStatsLoading, currentClans
}: BattleReportProps) {
  const maxRows = Math.max(joined.length, left.length);
  const avgWn8Joined = getAvgWn8(joined);
  const avgWn8Left = getAvgWn8(left);
  const netChange = joined.length - left.length;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface">
      {/* Title bar */}
      <div className="px-6 py-4 text-center bg-gradient-to-r from-success/[0.08] via-accent-primary/[0.05] to-danger/[0.08] border-b border-border">
        <h3 className="font-[family-name:var(--font-geist-mono)] text-lg font-bold tracking-wide text-text-primary">
          BATTLE REPORT
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          [{clanTag}] {clanName}
          {timestamp && <> &mdash; {timestamp}</>}
        </p>
      </div>

      {/* Scoreboard */}
      <div className="flex">
        {/* Joined side */}
        <div className="flex-1">
          <div className="px-5 py-3 flex items-center justify-between bg-success/[0.08] border-b-2 border-success">
            <span className="text-xs font-bold uppercase tracking-wider text-success">Joined</span>
            <span className="text-xl font-extrabold font-mono text-success">{joined.length}</span>
          </div>
          <div>
            {Array.from({ length: maxRows }).map((_, i) => {
              const player = joined[i];
              return (
                <div key={i} className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] border-b border-border/20 ${!player ? 'opacity-[0.12]' : ''}`}>
                  <span className="w-5 text-center text-text-tertiary font-semibold text-xs">{player ? i + 1 : '\u2014'}</span>
                  {player ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <PlayerCardTooltip accountId={player.account_id} accountName={player.account_name} clanTag={clanTag}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openPlayerJourney(player.account_id, player.account_name)}
                              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors text-left"
                            >
                              {player.account_name}
                            </button>
                            <a
                              href={`https://tomato.gg/stats/${encodeURIComponent(player.account_name)}-${player.account_id}/EU`}
                              target="_blank" rel="noopener noreferrer"
                              title="View on tomato.gg"
                              className="text-text-tertiary hover:text-cyan-400 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </PlayerCardTooltip>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {player.date && (
                            <span className="text-[10px] text-text-tertiary">{player.date}{player.time && <> &middot; {player.time}</>}</span>
                          )}
                          {player.sourceTag && (
                            <span className="text-[10px] text-text-secondary flex items-center gap-1">
                              {player.date && <span className="text-text-tertiary">·</span>}
                              <span className="text-text-tertiary">←</span>
                              <span className="font-bold text-[#60a5fa]">[{player.sourceTag}]</span>
                              {player.sourceName && (
                                <span className="text-text-tertiary">{player.sourceName}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      {player.stats ? (
                        <>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${getWN8BgColor(player.stats.wn8)} text-white`}>
                            {Math.round(player.stats.wn8)}
                          </span>
                          <span className="text-text-secondary text-xs min-w-[72px] text-right" title="60-day statistics">
                            {player.stats.battles} battles (60d)
                          </span>
                        </>
                      ) : (
                        <span className="text-text-tertiary text-xs italic">
                          {isStatsLoading ? 'Loading...' : 'No stats'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-text-tertiary flex-1">empty slot</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* VS Divider */}
        <div className="w-px bg-border relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface border-2 border-border flex items-center justify-center z-[2]">
            <span className="font-mono text-[11px] font-bold text-text-tertiary">VS</span>
          </div>
        </div>

        {/* Left side */}
        <div className="flex-1">
          <div className="px-5 py-3 flex items-center justify-between bg-danger/[0.08] border-b-2 border-danger">
            <span className="text-xs font-bold uppercase tracking-wider text-danger">Left</span>
            <span className="text-xl font-extrabold font-mono text-danger">{left.length}</span>
          </div>
          <div>
            {Array.from({ length: maxRows }).map((_, i) => {
              const player = left[i];
              return (
                <div key={i} className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] border-b border-border/20 ${!player ? 'opacity-[0.12]' : ''}`}>
                  <span className="w-5 text-center text-text-tertiary font-semibold text-xs">{player ? i + 1 : '\u2014'}</span>
                  {player ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <PlayerCardTooltip accountId={player.account_id} accountName={player.account_name} clanTag={player.destinationTag}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openPlayerJourney(player.account_id, player.account_name)}
                              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors text-left"
                            >
                              {player.account_name}
                            </button>
                            <a
                              href={`https://tomato.gg/stats/${encodeURIComponent(player.account_name)}-${player.account_id}/EU`}
                              target="_blank" rel="noopener noreferrer"
                              title="View on tomato.gg"
                              className="text-text-tertiary hover:text-cyan-400 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </PlayerCardTooltip>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {player.date && (
                            <span className="text-[10px] text-text-tertiary">{player.date}{player.time && <> &middot; {player.time}</>}</span>
                          )}
                          {player.account_id in (currentClans ?? {}) ? (
                            currentClans![player.account_id] ? (
                              <span className="text-[10px] text-text-secondary flex items-center gap-1">
                                {player.date && <span className="text-text-tertiary">·</span>}
                                <span className="text-text-tertiary">→</span>
                                <span className="font-bold text-[#FF8C00]">[{currentClans![player.account_id]}]</span>
                              </span>
                            ) : (
                              <span className="text-[10px] flex items-center gap-1">
                                {player.date && <span className="text-text-tertiary">·</span>}
                                <span className="text-text-tertiary">→</span>
                                <X className="w-3 h-3 text-danger/70" />
                                <span className="text-danger/70 uppercase tracking-wider font-semibold">No Clan</span>
                              </span>
                            )
                          ) : null}
                        </div>
                      </div>
                      {player.stats ? (
                        <>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${getWN8BgColor(player.stats.wn8)} text-white`}>
                            {Math.round(player.stats.wn8)}
                          </span>
                          <span className="text-text-secondary text-xs min-w-[72px] text-right" title="60-day statistics">
                            {player.stats.battles} battles (60d)
                          </span>
                        </>
                      ) : (
                        <span className="text-text-tertiary text-xs italic">
                          {isStatsLoading ? 'Loading...' : 'No stats'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-text-tertiary flex-1">empty slot</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary footer */}
      <div className="px-6 py-4 bg-surface-elevated/30 border-t border-border flex justify-center gap-10 text-[13px] text-text-secondary">
        <div className="text-center">
          <div className={`text-lg font-extrabold font-mono ${netChange > 0 ? 'text-success' : netChange < 0 ? 'text-danger' : 'text-text-primary'}`}>
            {netChange > 0 ? '+' : ''}{netChange}
          </div>
          <div className="text-[11px] uppercase tracking-wider mt-0.5">Net Change</div>
        </div>
        {avgWn8Joined !== null && (
          <div className="text-center">
            <div className={`text-lg font-extrabold font-mono ${getWN8Color(avgWn8Joined)}`}>{Math.round(avgWn8Joined)}</div>
            <div className="text-[11px] uppercase tracking-wider mt-0.5">Avg WN8 Joined</div>
          </div>
        )}
        {avgWn8Left !== null && (
          <div className="text-center">
            <div className={`text-lg font-extrabold font-mono ${getWN8Color(avgWn8Left)}`}>{Math.round(avgWn8Left)}</div>
            <div className="text-[11px] uppercase tracking-wider mt-0.5">Avg WN8 Left</div>
          </div>
        )}
        {avgWn8Joined !== null && avgWn8Left !== null && (
          <div className="text-center">
            <div className={`text-lg font-extrabold font-mono ${avgWn8Joined - avgWn8Left > 0 ? 'text-success' : 'text-danger'}`}>
              {avgWn8Joined - avgWn8Left > 0 ? '+' : ''}{Math.round(avgWn8Joined - avgWn8Left)}
            </div>
            <div className="text-[11px] uppercase tracking-wider mt-0.5">WN8 Delta</div>
          </div>
        )}
      </div>
    </div>
  );
}

function getAvgWn8(players: BattleReportPlayer[]): number | null {
  const withStats = players.filter(p => p.stats?.wn8);
  if (withStats.length === 0) return null;
  return withStats.reduce((sum, p) => sum + (p.stats?.wn8 || 0), 0) / withStats.length;
}
