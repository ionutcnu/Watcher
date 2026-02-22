'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { AuthModal } from '@/components/auth/auth-modal';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { LiveTicker } from '@/components/ui/live-ticker';

// rendering-hoist-jsx: static markup outside component
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/monitoring', label: 'Monitoring' },
];

function TankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" fill="currentColor" className={className} aria-hidden="true">
      {/* Barrel */}
      <rect x="26" y="9.5" width="20" height="3" rx="1.5" />
      {/* Turret */}
      <path d="M14 13 Q15 6 24 6 Q33 6 34 13 Z" />
      {/* Hull */}
      <rect x="4" y="13" width="38" height="9" rx="1.5" />
      {/* Track */}
      <rect x="2" y="19" width="42" height="9" rx="4.5" />
      {/* Wheels */}
      <circle cx="8"  cy="23.5" r="3" opacity="0.6" />
      <circle cx="16" cy="23.5" r="3" opacity="0.6" />
      <circle cx="24" cy="23.5" r="3" opacity="0.6" />
      <circle cx="32" cy="23.5" r="3" opacity="0.6" />
      <circle cx="40" cy="23.5" r="3" opacity="0.6" />
    </svg>
  );
}

function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return '';
  if (nameOrEmail.includes('@')) return nameOrEmail[0].toUpperCase();
  return nameOrEmail
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Header() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [signupEnabled, setSignupEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/signup-check')
      .then((r) => r.json())
      .then((d) => { if (d.enabled) setSignupEnabled(true); })
      .catch(() => setSignupEnabled(false));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // rerender-derived-state: computed during render
  const visibleLinks = [
    ...NAV_LINKS,
    ...(session?.user ? [{ href: '/admin', label: 'Admin' }] : []),
  ];
  const userName = session?.user?.name || session?.user?.email || '';
  const initials  = getInitials(userName);
  const displayName = session?.user?.name || session?.user?.email || '';

  return (
    <>
      <header className="sticky top-0 z-40 w-full" style={{ background: '#0d0b09' }}>

        {/* Top scanner line — full width amber glow */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #CC7000 15%, #FF8C00 40%, #FFB020 50%, #FF8C00 60%, #CC7000 85%, transparent 100%)',
            boxShadow: '0 0 12px 1px rgba(255,140,0,0.5)',
          }}
        />

        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between gap-8">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <TankIcon className="w-10 h-7 text-[#CC8800] group-hover:text-[#FF8C00] transition-colors" />
            <div className="leading-none">
              <div
                className="text-base font-bold tracking-widest text-[#e8dfc8] group-hover:text-white transition-colors uppercase"
                style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif" }}
              >
                WoT Clan
              </div>
              <div className="text-[10px] tracking-[0.2em] text-[#5a5040] uppercase mt-0.5">
                Watcher
              </div>
            </div>
          </Link>

          {/* ── Navigation ── */}
          <nav aria-label="Main navigation" className="flex items-stretch h-14">
            {visibleLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center px-5 text-sm font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00] focus-visible:ring-inset ${
                    isActive
                      ? 'text-[#FF8C00]'
                      : 'text-[#7a6f5e] hover:text-[#c8bfaa]'
                  }`}
                >
                  {label}
                  {isActive && (
                    <>
                      {/* Underline bar */}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                        style={{
                          background: '#FF8C00',
                          boxShadow: '0 0 10px 1px rgba(255,140,0,0.6)',
                        }}
                      />
                      {/* Subtle top highlight on active tab */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-full pointer-events-none"
                        style={{ background: 'linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 60%)' }}
                      />
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Auth ── */}
          <div className="flex items-center gap-3 shrink-0">
            {isPending ? (
              <div
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ background: '#1e1a14' }}
                aria-hidden="true"
              />
            ) : session?.user ? (
              <>
                {/* Avatar + name + bell */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #CC5500 100%)' }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col gap-[3px] leading-none">
                    <span className="text-sm font-medium text-[#c8bfaa]">{displayName}</span>
                    <Bell className="w-3 h-3 text-[#5a5040]" aria-label="Notifications" />
                  </div>
                </div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-1.5 text-sm font-medium text-[#9a8878] rounded transition-all hover:text-[#e8dfc8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                  style={{
                    background: 'linear-gradient(180deg, #1c1812 0%, #14120e 100%)',
                    border: '1px solid #3a3020',
                    boxShadow: 'inset 0 1px 0 rgba(255,200,80,0.06)',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-1.5 text-sm font-medium text-[#9a8878] rounded transition-all hover:text-[#e8dfc8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                  style={{
                    background: 'linear-gradient(180deg, #1c1812 0%, #14120e 100%)',
                    border: '1px solid #3a3020',
                    boxShadow: 'inset 0 1px 0 rgba(255,200,80,0.06)',
                  }}
                >
                  Sign In
                </button>
                {signupEnabled && (
                  <button
                    onClick={() => openAuthModal('register')}
                    className="px-4 py-1.5 text-sm font-medium text-white rounded transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                    style={{
                      background: 'linear-gradient(180deg, #FF8C00 0%, #CC5500 100%)',
                      boxShadow: '0 2px 8px rgba(255,140,0,0.25)',
                    }}
                  >
                    Sign Up
                  </button>
                )}
              </>
            )}
          </div>

        </div>

        {/* Live activity ticker */}
        <LiveTicker />

        {/* Bottom separator */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #2a2418 20%, #3a3020 50%, #2a2418 80%, transparent)' }}
        />
      </header>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      )}
    </>
  );
}
