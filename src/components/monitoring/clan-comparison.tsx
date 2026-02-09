'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MonitoredClan } from '@/types/monitoring';

interface ClanStats {
  clan_id: number;
  tag: string;
  name: string;
  member_count: number;
  avg_wn8: number | null;
  avg_damage: number | null;
  avg_winrate: number | null;
  rating: number | null;
}

interface ClanComparisonProps {
  clans: MonitoredClan[];
  clanRatings?: Record<number, number | null>;
}

const METRICS = [
  { key: 'rating', label: 'Clan Rating', max: 10000 },
  { key: 'member_count', label: 'Members', max: 100 },
  { key: 'avg_wn8', label: 'Avg WN8', max: 3000 },
  { key: 'avg_winrate', label: 'Win Rate', max: 65 },
  { key: 'avg_damage', label: 'Avg Dmg', max: 3000 },
] as const;

type MetricKey = typeof METRICS[number]['key'];

const CENTER = 180;
const RADIUS = 140;
const RINGS = 4;

export function ClanComparison({ clans, clanRatings }: ClanComparisonProps) {
  const [clan1Id, setClan1Id] = useState<number | null>(null);
  const [clan2Id, setClan2Id] = useState<number | null>(null);
  const [stats1, setStats1] = useState<ClanStats | null>(null);
  const [stats2, setStats2] = useState<ClanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const enabledClans = clans.filter(c => c.enabled);

  // Set defaults when clans load
  useEffect(() => {
    if (enabledClans.length >= 2 && !clan1Id && !clan2Id) {
      setClan1Id(enabledClans[0].clan_id);
      setClan2Id(enabledClans[1].clan_id);
    }
  }, [enabledClans, clan1Id, clan2Id]);

  const fetchComparison = async () => {
    if (!clan1Id || !clan2Id) return;
    setLoading(true);
    try {
      // We'll construct stats from available data
      const [s1, s2] = await Promise.all([
        buildClanStats(clan1Id, clans, clanRatings),
        buildClanStats(clan2Id, clans, clanRatings),
      ]);
      setStats1(s1);
      setStats2(s2);
    } finally {
      setLoading(false);
    }
  };

  if (enabledClans.length < 2) return null;

  return (
    <Card variant="elevated" className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-lg">Clan Comparison</CardTitle>
          <span className="text-text-secondary text-sm">{expanded ? '▼' : '▶'}</span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {/* Clan selectors */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <select
              value={clan1Id ?? ''}
              onChange={e => setClan1Id(Number(e.target.value))}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              {enabledClans.map(c => (
                <option key={c.clan_id} value={c.clan_id} disabled={c.clan_id === clan2Id}>
                  [{c.tag}] {c.name}
                </option>
              ))}
            </select>
            <span className="text-text-tertiary font-mono text-sm font-bold">VS</span>
            <select
              value={clan2Id ?? ''}
              onChange={e => setClan2Id(Number(e.target.value))}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              {enabledClans.map(c => (
                <option key={c.clan_id} value={c.clan_id} disabled={c.clan_id === clan1Id}>
                  [{c.tag}] {c.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={fetchComparison} disabled={loading || !clan1Id || !clan2Id}>
              {loading ? 'Loading...' : 'Compare'}
            </Button>
          </div>

          {stats1 && stats2 && (
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Radar SVG */}
              <RadarChart stats1={stats1} stats2={stats2} />

              {/* Stat comparison bars */}
              <div className="flex-1 min-w-[280px]">
                <div className="flex items-center gap-3 mb-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-accent-primary" />
                    <b className="text-accent-primary">[{stats1.tag}]</b>
                  </span>
                  <span className="text-text-tertiary">vs</span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-danger" />
                    <b className="text-danger">[{stats2.tag}]</b>
                  </span>
                </div>
                {METRICS.map(m => (
                  <ComparisonRow
                    key={m.key}
                    label={m.label}
                    val1={getMetricValue(stats1, m.key)}
                    val2={getMetricValue(stats2, m.key)}
                    max={m.max}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function RadarChart({ stats1, stats2 }: { stats1: ClanStats; stats2: ClanStats }) {
  const numAxes = METRICS.length;
  const angleStep = (2 * Math.PI) / numAxes;

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value * RADIUS);
    return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
  };

  const gridPolygons = useMemo(() => {
    return Array.from({ length: RINGS }, (_, ring) => {
      const scale = (ring + 1) / RINGS;
      return METRICS.map((_, i) => getPoint(i, scale)).map(p => p.join(',')).join(' ');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const axisLines = METRICS.map((_, i) => getPoint(i, 1));

  const poly1 = METRICS.map((m, i) => {
    const val = getMetricValue(stats1, m.key);
    const normalizedVal = (val !== null && val !== undefined && !isNaN(val)) ? Math.min(1, val / m.max) : 0;
    return getPoint(i, normalizedVal);
  }).map(p => p.join(',')).join(' ');

  const poly2 = METRICS.map((m, i) => {
    const val = getMetricValue(stats2, m.key);
    const normalizedVal = (val !== null && val !== undefined && !isNaN(val)) ? Math.min(1, val / m.max) : 0;
    return getPoint(i, normalizedVal);
  }).map(p => p.join(',')).join(' ');

  const labels = METRICS.map((m, i) => {
    const [x, y] = getPoint(i, 1.18);
    return { label: m.label, x, y };
  });

  return (
    <svg viewBox="0 0 360 360" className="w-full max-w-[360px]">
      {/* Grid rings */}
      <g opacity="0.15">
        {gridPolygons.map((points, i) => (
          <polygon key={i} points={points} fill="none" stroke="var(--text-secondary)" strokeWidth="1" />
        ))}
      </g>
      {/* Axis lines */}
      <g opacity="0.1">
        {axisLines.map(([x, y], i) => (
          <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--text-secondary)" strokeWidth="1" />
        ))}
      </g>
      {/* Clan 1 polygon (blue) */}
      <polygon points={poly1} fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.8)" strokeWidth="2" />
      {/* Clan 2 polygon (red) */}
      <polygon points={poly2} fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.8)" strokeWidth="2" />
      {/* Data points */}
      {METRICS.map((m, i) => {
        const val1 = getMetricValue(stats1, m.key);
        const normalizedVal1 = (val1 !== null && val1 !== undefined && !isNaN(val1)) ? Math.min(1, val1 / m.max) : 0;
        const [x1, y1] = getPoint(i, normalizedVal1);
        const val2 = getMetricValue(stats2, m.key);
        const normalizedVal2 = (val2 !== null && val2 !== undefined && !isNaN(val2)) ? Math.min(1, val2 / m.max) : 0;
        const [x2, y2] = getPoint(i, normalizedVal2);
        return (
          <g key={m.key}>
            <circle cx={x1} cy={y1} r="4" fill="#3b82f6" />
            <circle cx={x2} cy={y2} r="4" fill="#ef4444" />
          </g>
        );
      })}
      {/* Labels */}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text-primary)" fontSize="11" fontWeight="600">
          {l.label}
        </text>
      ))}
    </svg>
  );
}

function ComparisonRow({ label, val1, val2, max }: { label: string; val1: number | null; val2: number | null; max: number }) {
  const pct1 = val1 !== null ? Math.min(100, (val1 / max) * 100) : 0;
  const pct2 = val2 !== null ? Math.min(100, (val2 / max) * 100) : 0;
  const format = (v: number | null | undefined) => {
    if (v == null || typeof v !== 'number' || isNaN(v)) return '--';
    return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(v % 1 === 0 ? 0 : 1);
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 text-[13px]">
      <span className="w-[90px] text-text-secondary shrink-0">{label}</span>
      <span className="w-[50px] text-right font-mono font-bold text-accent-primary">{format(val1)}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1 rounded-full bg-border/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full rounded-full bg-accent-primary" style={{ width: `${pct1}%` }} />
        </div>
        <div className="h-1 rounded-full bg-border/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full rounded-full bg-danger" style={{ width: `${pct2}%` }} />
        </div>
      </div>
      <span className="w-[50px] text-right font-mono font-bold text-danger">{format(val2)}</span>
    </div>
  );
}

function getMetricValue(stats: ClanStats, key: MetricKey): number | null {
  return stats[key] ?? null;
}

async function buildClanStats(
  clanId: number,
  clans: MonitoredClan[],
  clanRatings?: Record<number, number | null>,
): Promise<ClanStats> {
  const clan = clans.find(c => c.clan_id === clanId);

  // Fetch stats from Tomato.gg via API
  let avg_wn8: number | null = null;
  let avg_damage: number | null = null;
  let avg_winrate: number | null = null;
  let member_count: number = clan?.last_member_count ?? 0;

  try {
    const response = await fetch(`/api/clan-stats?clan_id=${clanId}&region=eu`);
    const result = await response.json();

    if (result.success && result.stats) {
      avg_wn8 = result.stats.avg_wn8;
      avg_damage = result.stats.avg_damage;
      avg_winrate = result.stats.avg_winrate;
      member_count = result.stats.members_count || member_count; // Use Tomato.gg count if available

      // Use Tomato.gg clan rating if available, fall back to Wargaming rating
      const tomatoRating = result.stats.clan_rating;
      const wargamingRating = clanRatings?.[clanId] ?? null;
      const rating = tomatoRating ?? wargamingRating;

      return {
        clan_id: clanId,
        tag: clan?.tag ?? '???',
        name: clan?.name ?? 'Unknown',
        member_count,
        avg_wn8,
        avg_damage,
        avg_winrate,
        rating,
      };
    }
  } catch {
    // Fallback to Wargaming rating on error
  }

  // Fallback if API failed
  return {
    clan_id: clanId,
    tag: clan?.tag ?? '???',
    name: clan?.name ?? 'Unknown',
    member_count,
    avg_wn8,
    avg_damage,
    avg_winrate,
    rating: clanRatings?.[clanId] ?? null,
  };
}
