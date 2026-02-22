'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryEvent {
  type: 'join' | 'leave';
  clan_tag: string;
  clan_name: string;
  timestamp: number;
  date: string;
  source: 'tomato' | 'wg' | 'db';
}

interface CurrentClan {
  tag: string;
  name: string;
  color: string | null;
  members_count: number;
  emblemUrl: string | null;
}

interface Stay {
  tag: string;
  name: string;
  joinDate: string;
  leaveDate: string | null;
  durationDays: number;
  isCurrent: boolean;
  /** True when we only have a leave record — player was already in this clan when tracking started */
  isOrphan: boolean;
}

function buildStays(events: HistoryEvent[]): Stay[] {
  const stays: Stay[] = [];
  let i = 0;

  // First event is a leave → player was already in this clan before we started tracking
  if (events.length > 0 && events[0].type === 'leave') {
    const ev = events[0];
    stays.push({
      tag: ev.clan_tag,
      name: ev.clan_name,
      joinDate: '?',
      leaveDate: ev.date,
      durationDays: -1,
      isCurrent: false,
      isOrphan: true,
    });
    i = 1;
  }

  while (i < events.length) {
    const ev = events[i];
    if (ev.type !== 'join') { i++; continue; }

    const leaveIdx = events.findIndex((e, idx) => idx > i && e.type === 'leave');
    const leaveEv = leaveIdx !== -1 ? events[leaveIdx] : null;

    const durationMs = leaveEv
      ? (leaveEv.timestamp - ev.timestamp) * 1000
      : Date.now() - ev.timestamp * 1000;
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

    stays.push({
      tag: ev.clan_tag,
      name: ev.clan_name,
      joinDate: ev.date,
      leaveDate: leaveEv?.date ?? null,
      durationDays,
      isCurrent: !leaveEv,
      isOrphan: false,
    });

    i = leaveEv ? leaveIdx + 1 : events.length;
  }

  return stays;
}

function StayNode({ stay, index }: { stay: Stay; index: number }) {
  const borderColor = stay.isCurrent ? '#CC8800' : '#2a2418';
  const tagColor = stay.isCurrent ? '#FF8C00' : stay.isOrphan ? '#3a3020' : '#c8b888';

  return (
    <div
      className="relative flex flex-col gap-1.5 px-4 py-3.5 rounded-lg w-full"
      style={{
        background: stay.isCurrent
          ? 'rgba(204,136,0,0.07)'
          : stay.isOrphan
          ? 'rgba(20,16,10,0.6)'
          : 'rgba(13,11,9,0.9)',
        border: `1px ${stay.isOrphan ? 'dashed' : 'solid'} ${borderColor}`,
      }}
    >
      <div className="absolute top-2 right-2 text-[9px] tabular-nums" style={{ color: '#3a3020' }}>
        #{index + 1}
      </div>
      {stay.isCurrent && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded whitespace-nowrap"
          style={{ background: '#CC8800', color: '#0b0900', fontFamily: "'Oswald', sans-serif" }}
        >
          CURRENT
        </div>
      )}

      <div className="font-mono font-bold text-[15px] leading-none" style={{ color: tagColor }}>
        [{stay.tag}]
      </div>

      <div
        className="text-[11px] leading-tight line-clamp-2"
        style={{ color: '#5a5040' }}
        title={stay.name}
      >
        {stay.name}
      </div>

      <div className="flex flex-col gap-0.5 text-[10px] mt-0.5">
        {stay.isOrphan ? (
          <span style={{ color: '#3a3020' }}>Before tracking</span>
        ) : (
          <span style={{ color: '#7a6a4a' }}>{stay.joinDate}</span>
        )}
        {stay.leaveDate && (
          <span style={{ color: '#4a3a28' }}>→ {stay.leaveDate}</span>
        )}
        {stay.isCurrent && (
          <span style={{ color: '#4a7a4a' }}>→ present</span>
        )}
      </div>

      <div
        className="text-[10px] px-1.5 py-0.5 rounded w-fit mt-0.5"
        style={{
          background: stay.isCurrent ? 'rgba(204,136,0,0.15)' : 'rgba(20,16,10,0.8)',
          color: stay.isCurrent ? '#CC8800' : stay.isOrphan ? '#3a3020' : '#5a5040',
        }}
      >
        {stay.isCurrent
          ? `${stay.durationDays}d+ active`
          : stay.durationDays >= 0
          ? `${stay.durationDays}d`
          : 'unknown'}
      </div>
    </div>
  );
}


const VISIBLE_COUNT = 10;

export function PlayerJourneyTimeline() {
  const [open, setOpen] = useState(false);
  const [player, setPlayer] = useState<{ id: number; name: string } | null>(null);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'tomato' | 'wg' | 'db' | null>(null);
  const [currentClan, setCurrentClan] = useState<CurrentClan | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleOpen = useCallback((e: Event) => {
    const { playerId, playerName } = (e as CustomEvent<{ playerId: number; playerName: string }>).detail;
    setPlayer({ id: playerId, name: playerName });
    setOpen(true);
    setEvents([]);
    setError(null);
    setDataSource(null);
    setCurrentClan(null);
    setShowAll(false);
  }, []);

  useEffect(() => {
    window.addEventListener('open-player-journey', handleOpen);
    return () => window.removeEventListener('open-player-journey', handleOpen);
  }, [handleOpen]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Fetch history when modal opens
  useEffect(() => {
    if (!open || !player) return;
    setLoading(true);
    const params = new URLSearchParams({ playerId: String(player.id), playerName: player.name });
    fetch(`/api/player-history?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setEvents(data.history);
          setDataSource(data.source ?? null);
          setCurrentClan(data.currentClan ?? null);
        } else {
          setError(data.error || 'Failed to load history');
        }
      })
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false));
  }, [open, player]);

  const stays = buildStays(events);
  const knownDays = stays.reduce((s, st) => s + (st.durationDays >= 0 ? st.durationDays : 0), 0);
  // Most recent first
  const reversed = [...stays].reverse();
  const hasMore = reversed.length > VISIBLE_COUNT;
  const visible = showAll ? reversed : reversed.slice(0, VISIBLE_COUNT);

  return (
    <AnimatePresence>
      {open && player && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', zIndex: 300 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-5xl max-h-[80vh] flex flex-col rounded-xl overflow-hidden"
            style={{ background: '#0d0b09', border: '1px solid #2a2418' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ background: '#0b0900', borderBottom: '1px solid #2a2418' }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-[.22em] mb-1"
                  style={{ color: '#4a3a1a', fontFamily: "'Oswald', sans-serif" }}
                >
                  {'// '}INTEL FILE — CLAN MOVEMENTS
                </p>
                <div className="flex items-center gap-3">
                  {currentClan?.emblemUrl && (
                    <img src={currentClan.emblemUrl} alt={`[${currentClan.tag}]`} className="w-8 h-8" />
                  )}
                  <h2
                    className="text-xl font-bold"
                    style={{ color: '#e8dfc8', fontFamily: "'Oswald', sans-serif" }}
                  >
                    {player.name}
                  </h2>
                  <a
                    href={`https://tomato.gg/stats/EU/${encodeURIComponent(player.name)}=${player.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] transition-colors hover:text-[#FF8C00]"
                    style={{ color: '#4a3a1a' }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    tomato.gg
                  </a>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded transition-colors hover:bg-white/5"
                style={{ color: '#4a3a1a' }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats strip */}
            {!loading && stays.length > 0 && (
              <div
                className="flex gap-6 px-6 py-2.5 text-[11px] shrink-0"
                style={{ background: '#0e0c08', borderBottom: '1px solid #1a1612' }}
              >
                <span style={{ color: '#5a4a2a' }}>
                  CLANS TRACKED:{' '}
                  <span style={{ color: '#CC8800' }}>{stays.length}</span>
                </span>
                {knownDays > 0 && (
                  <span style={{ color: '#5a4a2a' }}>
                    TOTAL TRACKED:{' '}
                    <span style={{ color: '#CC8800' }}>{knownDays} days</span>
                  </span>
                )}
                <span style={{ color: '#5a4a2a' }}>
                  STATUS:{' '}
                  <span style={{ color: stays.some(s => s.isCurrent) ? '#4a9a4a' : '#8a6a4a' }}>
                    {stays.some(s => s.isCurrent) ? 'IN CLAN' : 'CLANLESS / UNTRACKED'}
                  </span>
                </span>
                {dataSource && (
                  <span
                    className="ml-auto px-2 py-0.5 rounded text-[9px] uppercase tracking-widest"
                    style={{
                      background: dataSource === 'tomato' ? 'rgba(96,165,250,0.1)' : dataSource === 'wg' ? 'rgba(74,180,74,0.1)' : 'rgba(204,136,0,0.1)',
                      color: dataSource === 'tomato' ? '#60a5fa' : dataSource === 'wg' ? '#4ab44a' : '#CC8800',
                      border: `1px solid ${dataSource === 'tomato' ? 'rgba(96,165,250,0.2)' : dataSource === 'wg' ? 'rgba(74,180,74,0.2)' : 'rgba(204,136,0,0.2)'}`,
                    }}
                  >
                    {{ tomato: 'via Tomato.gg', wg: 'via Wargaming API', db: 'via ClanSpy DB' }[dataSource]}
                  </span>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
              {loading && (
                <div className="flex items-center justify-center gap-3 py-16" style={{ color: '#4a3a1a' }}>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span
                    className="text-sm uppercase tracking-widest"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    Retrieving intel...
                  </span>
                </div>
              )}

              {error && (
                <div className="text-center py-16 text-sm" style={{ color: '#cc4444' }}>
                  {error}
                </div>
              )}

              {!loading && !error && stays.length === 0 && (
                <div className="text-center py-16">
                  <p
                    className="text-sm uppercase tracking-widest"
                    style={{ color: '#4a3a1a', fontFamily: "'Oswald', sans-serif" }}
                  >
                    No movement records found
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#2a2010' }}>
                    This player has no tracked clan changes in the database.
                  </p>
                </div>
              )}

              {!loading && !error && stays.length > 0 && (
                <>
                  {/* Grid: most recent first */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {visible.map((stay, idx) => (
                      <StayNode key={idx} stay={stay} index={reversed.indexOf(stay)} />
                    ))}
                  </div>

                  {/* Show more / collapse */}
                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setShowAll(v => !v)}
                        className="px-4 py-1.5 rounded text-[11px] uppercase tracking-widest transition-colors hover:bg-white/5"
                        style={{
                          color: '#CC8800',
                          border: '1px solid rgba(204,136,0,0.25)',
                          fontFamily: "'Oswald', sans-serif",
                        }}
                      >
                        {showAll
                          ? '↑ Show less'
                          : `↓ Show all ${stays.length} clans`}
                      </button>
                    </div>
                  )}

                  {/* Legend */}
                  <div
                    className="mt-6 pt-4 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest"
                    style={{ borderTop: '1px solid #1a1612', color: '#3a3020', fontFamily: "'Oswald', sans-serif" }}
                  >
                    <span>{'// '}Source: {{ tomato: 'Tomato.gg (full history)', wg: 'Wargaming API (official history)', db: 'ClanSpy DB (monitored clans only)' }[dataSource ?? 'db']}</span>
                    <span>{'// '}Dashed border = only partial data available</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Call this from any component to open the journey modal */
export function openPlayerJourney(playerId: number, playerName: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('open-player-journey', { detail: { playerId, playerName } })
  );
}
