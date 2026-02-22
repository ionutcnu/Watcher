'use client';

import { useReducedMotion } from 'framer-motion';

interface ManualCheckProgressProps {
  message: string;
  percent: number;
  details: { current: number; total: number; type: string } | null;
}

const BLIPS = [
  { top: '32%', left: '58%', delay: '0.6s' },
  { top: '70%', left: '30%', delay: '1.9s' },
  { top: '22%', left: '42%', delay: '1.2s' },
  { top: '65%', left: '68%', delay: '0.1s' },
  { top: '40%', left: '76%', delay: '2.4s' },
  { top: '55%', left: '18%', delay: '1.7s' },
];

const TOTAL_SEGS = 20;

export function ManualCheckProgress({ message, percent, details }: ManualCheckProgressProps) {
  const shouldReduceMotion = useReducedMotion();
  const filledSegs = Math.round((Math.min(100, Math.max(0, percent)) / 100) * TOTAL_SEGS);

  return (
    <div
      className="mb-8 overflow-visible relative"
      style={{
        background: '#0d0b09',
        border: '1px solid #2a2418',
        borderRadius: 2,
      }}
    >
      {/* Bracket corners */}
      <span aria-hidden="true" className="pointer-events-none absolute top-[-1px] left-[-1px] w-[13px] h-[13px] border-t-2 border-l-2 border-[#CC8800] z-10" />
      <span aria-hidden="true" className="pointer-events-none absolute top-[-1px] right-[-1px] w-[13px] h-[13px] border-t-2 border-r-2 border-[#CC8800] z-10" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[-1px] left-[-1px] w-[13px] h-[13px] border-b-2 border-l-2 border-[#CC8800] z-10" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[-1px] right-[-1px] w-[13px] h-[13px] border-b-2 border-r-2 border-[#CC8800] z-10" />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: '1px solid #2a2418', background: '#080706' }}
      >
        <span
          className="text-[11px] tracking-[.2em] uppercase"
          style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#CC8800' }}
        >
          {'// '}Multi-Scan Active
        </span>
        <span
          className="text-[11px] tracking-[.1em] uppercase"
          style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#3a3020' }}
        >
          Classification: Restricted
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row items-center gap-8 p-8">

        {/* Radar */}
        <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle, #010f02 0%, #010802 100%)',
              border: '1px solid rgba(0,255,68,0.18)',
              boxShadow: '0 0 30px rgba(0,255,68,0.04), inset 0 0 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Range rings */}
            {[75, 50, 25].map((size) => (
              <div
                key={size}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: `${size}%`, height: `${size}%`, border: '1px solid rgba(0,255,68,0.1)' }}
              />
            ))}

            {/* Crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2" style={{ width: 1, background: 'rgba(0,255,68,0.07)' }} />
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: 1, background: 'rgba(0,255,68,0.07)' }} />

            {/* Sweep */}
            {!shouldReduceMotion && (
              <div
                className="absolute inset-0 rounded-full"
                style={{ animation: 'radarSpin 3s linear infinite' }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, rgba(0,255,68,0.2) 0deg, rgba(0,255,68,0.05) 55deg, transparent 85deg)',
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 origin-left"
                  style={{
                    width: '50%', height: 1,
                    background: 'linear-gradient(90deg, rgba(0,255,68,0.9) 0%, transparent 100%)',
                    boxShadow: '0 0 6px rgba(0,255,68,0.7)',
                    transform: 'translateY(-50%)',
                  }}
                />
              </div>
            )}

            {/* Blips */}
            {BLIPS.map((b, i) => (
              <div key={i} className="radar-blip" style={{ top: b.top, left: b.left, animationDelay: b.delay }} />
            ))}
          </div>
        </div>

        {/* Progress info */}
        <div className="flex-1 w-full space-y-5">

          {/* Current target */}
          <div>
            <div
              className="text-[11px] tracking-[.15em] uppercase mb-1"
              style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#00cc30' }}
            >
              {'// '}Target acquired
            </div>
            <div
              className="text-lg tracking-wide"
              style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#e8dfc8' }}
            >
              {message}
            </div>
          </div>

          {/* Ammo-clip progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span
                className="text-[11px] tracking-[.12em] uppercase"
                style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#52525b' }}
              >
                {'// '}Scan progress
              </span>
              {details && (
                <span
                  className="text-sm"
                  style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#CC8800' }}
                >
                  {details.current} / {details.total} {details.type}
                </span>
              )}
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: TOTAL_SEGS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-[14px] rounded-[2px] transition-all duration-300"
                  style={
                    i < filledSegs
                      ? { background: 'linear-gradient(180deg, #00cc30 0%, #008820 100%)', boxShadow: '0 0 4px rgba(0,204,48,0.4)' }
                      : { background: 'rgba(255,255,255,0.07)' }
                  }
                />
              ))}
            </div>
            <div
              className="text-[11px] tracking-[.1em] uppercase"
              style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#3a3020' }}
            >
              {Math.round(percent)}{'% \u2014 Please stand by\u2026'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
