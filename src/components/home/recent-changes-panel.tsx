'use client';

import { Activity, ExternalLink } from 'lucide-react';
import { ClanChange } from '@/types/clan';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { motion, useReducedMotion } from 'framer-motion';
import { openPlayerJourney } from '@/components/ui/player-journey-timeline';

interface RecentChangesPanelProps {
  recentChanges: ClanChange[];
  lastScannedClan: { clan_id: number; tag: string; name: string } | null;
  onExport: () => void;
  hasExportData: boolean;
}

export function RecentChangesPanel({ recentChanges, lastScannedClan, onExport, hasExportData }: RecentChangesPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const displayChanges = lastScannedClan
    ? recentChanges.filter((c) => c.clan.clan_id === lastScannedClan.clan_id)
    : recentChanges;

  return (
    <Card variant="bracket" className="overflow-visible">
      {/* Intel header */}
      <div
        className="flex justify-between items-center px-5 py-3"
        style={{ background: '#0d0b09', borderBottom: '1px solid #2a2418' }}
      >
        <div
          className="text-[13px] tracking-[.18em] uppercase leading-none"
          style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#CC8800' }}
        >
          {'// '}Intel Feed &mdash;{' '}
          <span style={{ color: '#e8dfc8' }}>
            {lastScannedClan ? `[${lastScannedClan.tag}]` : 'Last 7 Days'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] tracking-[.1em] uppercase hidden md:block"
            style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#3a3020' }}
          >
            Classification: Open
          </span>
          <Button onClick={onExport} disabled={!hasExportData} variant="secondary" size="sm">
            Export CSV
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        {displayChanges.length > 0 ? (
          <ul className="list-none m-0 p-0">
            {displayChanges.slice(0, 5).map((change, index) => (
              <motion.li
                key={`${change.player.account_id}-${change.timestamp}-${change.type}`}
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                animate={shouldReduceMotion ? {} : { opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="intel-entry"
              >
                {/* Rotated stamp */}
                <div className={`intel-stamp ${change.type}`}>
                  <span className="intel-stamp-icon">
                    {change.type === 'join' ? '↑' : '↓'}
                  </span>
                  {change.type === 'join' ? 'JOINED' : 'LEFT'}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPlayerJourney(change.player.account_id, change.player.account_name)}
                      className="font-medium hover:text-[#FF8C00] transition-colors text-left truncate"
                      style={{ color: '#e8dfc8', fontSize: 14 }}
                    >
                      {change.player.account_name}
                    </button>
                    <a
                      href={`https://tomato.gg/stats/EU/${encodeURIComponent(change.player.account_name)}=${change.player.account_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on tomato.gg"
                      className="shrink-0 transition-colors hover:text-[#FF8C00]"
                      style={{ color: '#7a6a4a' }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: '#52525b' }}>
                    [{change.clan.tag}]&nbsp;{change.clan.name}
                  </p>
                  {change.type === 'join' && (
                    <p className="text-[12px] mt-1 flex items-center gap-1.5">
                      <span style={{ color: '#52525b' }}>←</span>
                      <span style={{ color: '#71717a' }}>from</span>
                      {change.source ? (
                        <>
                          <span
                            className="font-semibold"
                            style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#60a5fa' }}
                          >
                            [{change.source.tag}]
                          </span>
                          <span style={{ color: '#71717a' }}>{change.source.name}</span>
                        </>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide cursor-default"
                          style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
                          title="Upgrade to see source clan"
                        >
                          <span>🔒</span>
                          <span>Dashboard only</span>
                        </span>
                      )}
                    </p>
                  )}
                  {change.type === 'leave' && (
                    <p className="text-[12px] mt-1 flex items-center gap-1.5">
                      <span style={{ color: '#52525b' }}>→</span>
                      <span style={{ color: '#71717a' }}>joined</span>
                      {change.destination ? (
                        <>
                          <span
                            className="font-semibold"
                            style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#FF8C00' }}
                          >
                            [{change.destination.tag}]
                          </span>
                          <span style={{ color: '#71717a' }}>{change.destination.name}</span>
                        </>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide cursor-default"
                          style={{ background: 'rgba(255,140,0,0.08)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.2)' }}
                          title="Upgrade to see destination clan"
                        >
                          <span>🔒</span>
                          <span>Dashboard only</span>
                        </span>
                      )}
                    </p>
                  )}
                  <p
                    className="text-[11px] mt-1.5 uppercase tracking-[.08em]"
                    style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#6a5c3a' }}
                  >
                    {'// '}<span style={{ color: '#9a8760' }}>{change.date}</span>
                    <span style={{ color: '#6a5c3a' }}> &middot; </span>
                    <span style={{ color: '#9a8760' }}>
                      {new Date(change.timestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : null}

        {displayChanges.length > 5 && (
          <div
            className="px-5 py-3 text-center text-[12px] border-t"
            style={{ background: 'rgba(255,140,0,0.04)', borderColor: 'rgba(255,140,0,0.12)' }}
          >
            <span style={{ color: '#7a6040' }}>
              +{displayChanges.length - 5} more events hidden &mdash;{' '}
            </span>
            <a
              href="/monitoring"
              className="font-semibold transition-colors hover:underline"
              style={{ color: '#FF8C00' }}
            >
              View full intel in Dashboard →
            </a>
          </div>
        )}

        {displayChanges.length === 0 && (
          <EmptyState
            icon={<Activity className="w-6 h-6" />}
            title="No intel available"
            description={
              lastScannedClan
                ? `No recent changes detected for [${lastScannedClan.tag}] ${lastScannedClan.name}.`
                : 'No player movements in the last 7 days. Scan a clan to gather intel.'
            }
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
