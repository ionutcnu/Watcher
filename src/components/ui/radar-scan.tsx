'use client';

import { useReducedMotion } from 'framer-motion';

interface RadarScanProps {
  clanTag: string;
  clanName: string;
}

const BLIPS = [
  { top: '28%', left: '62%', delay: '0.9s' },
  { top: '66%', left: '26%', delay: '2.2s' },
  { top: '18%', left: '38%', delay: '1.5s' },
  { top: '74%', left: '60%', delay: '0.3s' },
  { top: '44%', left: '78%', delay: '2.7s' },
];

export function RadarScan({ clanTag, clanName }: RadarScanProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center py-14 gap-8">

      {/* Radar circle */}
      <div className="relative" style={{ width: 200, height: 200 }}>
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

          {/* Sweep cone + leading edge */}
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
                  width: '50%',
                  height: 1,
                  background: 'linear-gradient(90deg, rgba(0,255,68,0.9) 0%, transparent 100%)',
                  boxShadow: '0 0 6px rgba(0,255,68,0.7)',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          )}

          {/* Blips */}
          {BLIPS.map((b, i) => (
            <div
              key={i}
              className="radar-blip"
              style={{ top: b.top, left: b.left, animationDelay: b.delay }}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        <div
          className="text-[11px] tracking-[.2em] uppercase"
          style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#00cc30' }}
        >
          {'// '}Scanning target
        </div>
        <div
          className="text-xl tracking-wide"
          style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif", color: '#e8dfc8' }}
        >
          [{clanTag}]&nbsp;{clanName}
        </div>
        <div className="text-sm" style={{ color: '#52525b', letterSpacing: '.05em' }}>
          Detecting member movements&hellip;
        </div>
      </div>

    </div>
  );
}
