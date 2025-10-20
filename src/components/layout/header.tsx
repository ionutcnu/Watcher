'use client';

import { useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/auth-modal';
import Link from 'next/link';

export function Header() {
  const { data: session, isPending } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl font-bold text-text-primary">
              WoT Clan Watcher
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/monitoring"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Monitoring
            </Link>
            {session?.user && (
              <Link
                href="/admin"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="text-text-tertiary text-sm">Loading...</div>
            ) : session?.user ? (
              <>
                <div className="text-sm text-text-secondary">
                  {session.user.name || session.user.email}
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => openAuthModal('login')}
                  variant="secondary"
                  size="sm"
                >
                  Sign In
                </Button>
                {/* Sign Up disabled - admin creates accounts */}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      )}
    </>
  );
}
