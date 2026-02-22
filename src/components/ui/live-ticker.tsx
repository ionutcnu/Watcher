'use client';

import { useEffect, useState } from 'react';
import { ClanChange } from '@/types/clan';

function relativeTime(timestamp: number): string {
  // timestamp may be seconds or ms — normalise to ms
  const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TickerItem({ change }: { change: ClanChange }) {
  const isJoin = change.type === 'join';
  return (
    <span
      className="ticker-item"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 20px',
        fontSize: 11,
        letterSpacing: '0.04em',
        color: '#a1a1aa',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {/* Dot */}
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          flexShrink: 0,
          background: isJoin ? '#10b981' : '#ef4444',
          boxShadow: isJoin ? '0 0 4px #10b981' : '0 0 4px #ef4444',
          display: 'inline-block',
        }}
      />
      {/* Player */}
      <strong style={{ color: '#e8dfc8', fontWeight: 600 }}>
        {change.player.account_name}
      </strong>
      {/* Action */}
      <span>{isJoin ? 'joined' : 'left'}</span>
      {/* Clan tag */}
      <span style={{ color: '#e8dfc8' }}>[{change.clan.tag}]</span>
      {/* Destination (leave events only) */}
      {!isJoin && change.destination && (
        <>
          <span style={{ color: '#52525b' }}>→</span>
          <span style={{ color: '#FF8C00' }}>[{change.destination.tag}]</span>
        </>
      )}
      {/* Time */}
      <span style={{ color: '#52525b', fontSize: 10 }}>
        {relativeTime(change.timestamp)}
      </span>
    </span>
  );
}

export function LiveTicker() {
  const [changes, setChanges] = useState<ClanChange[]>([]);

  useEffect(() => {
    fetch('/api/changes?days=7')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.changes)) {
          setChanges(d.changes.slice(0, 20));
        }
      })
      .catch(() => {});
  }, []);

  if (changes.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...changes, ...changes];
  // Duration scales with item count so speed feels consistent
  const duration = Math.max(20, changes.length * 3);

  return (
    <div
      aria-label="Live activity ticker"
      style={{
        background: '#0d0b09',
        borderTop: '1px solid #2a2418',
        borderBottom: '1px solid #2a2418',
        height: 28,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Label badge */}
      <div
        aria-hidden="true"
        style={{
          background: 'linear-gradient(90deg, #FF8C00, #CC5500)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px 0 12px',
          fontFamily: "'Oswald', 'Roboto Condensed', sans-serif",
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'white',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
          zIndex: 1,
        }}
      >
        ⚡ Live Intel
      </div>

      {/* Scrolling track */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            animation: `tickerScroll ${duration}s linear infinite`,
            whiteSpace: 'nowrap',
          }}
        >
          {items.map((change, i) => (
            <TickerItem key={i} change={change} />
          ))}
        </div>
      </div>
    </div>
  );
}
