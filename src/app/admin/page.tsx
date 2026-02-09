'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { ModernBackground } from '@/components/ui/modern-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSkeleton } from '@/components/admin/admin-skeleton';
import Link from 'next/link';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { UsersTable } from '@/components/admin/users-table';

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  emailVerified: number;
  active: number;
  createdAt: number;
  updatedAt: number;
}

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const result = await response.json();
      if (response.status === 403) { setError('Access denied. Admin privileges required.'); return; }
      if (result.success) setUsers(result.users);
      else setError(result.error || 'Failed to load users');
    } catch { setError('Failed to load users'); } finally { setLoading(false); }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();
      if (result.success) setSignupEnabled(result.settings.signupEnabled);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (session?.user) { loadUsers(); loadSettings(); }
  }, [session, loadUsers, loadSettings]);

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) return;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId }),
      });
      const result = await response.json();
      if (result.success) { await loadUsers(); toast.success(`User ${userEmail} deleted`); }
      else toast.error(result.error || 'Failed to delete user');
    } catch { toast.error('Failed to delete user'); }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', userId, active: !currentActive }),
      });
      const result = await response.json();
      if (result.success) { await loadUsers(); toast.success(`User ${currentActive ? 'deactivated' : 'activated'}`); }
      else toast.error(result.error || 'Failed to toggle user status');
    } catch { toast.error('Failed to toggle user status'); }
  };

  const toggleSignup = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupEnabled: !signupEnabled }),
      });
      const result = await response.json();
      if (result.success) { setSignupEnabled(!signupEnabled); toast.success(`Public sign-up ${!signupEnabled ? 'enabled' : 'disabled'}`); }
      else toast.error(result.error || 'Failed to update settings');
    } catch { toast.error('Failed to update settings'); } finally { setSettingsLoading(false); }
  };

  if (isPending || loading) {
    return (
      <ModernBackground>
        <AdminSkeleton />
      </ModernBackground>
    );
  }

  if (!session?.user) {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader><CardTitle className="text-2xl text-center">Authentication Required</CardTitle></CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-text-secondary">You need to be signed in to access the admin panel.</p>
            <Button asChild className="w-full"><Link href="/">Go to Home Page</Link></Button>
          </CardContent>
        </Card>
      </ModernBackground>
    );
  }

  if (error === 'Access denied. Admin privileges required.') {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader><CardTitle className="text-2xl text-center text-red-500">Access Denied</CardTitle></CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-text-secondary">You don&apos;t have permission to access the admin panel.</p>
            <p className="text-text-tertiary text-sm">Contact the system administrator if you need access.</p>
            <Button asChild className="w-full"><Link href="/">Go to Home Page</Link></Button>
          </CardContent>
        </Card>
      </ModernBackground>
    );
  }

  return (
    <ModernBackground>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-text-secondary">User Management</p>
          </div>
          <Button asChild variant="secondary"><Link href="/">← Back to Home</Link></Button>
        </div>

        {error && error !== 'Access denied. Admin privileges required.' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <Card className="mb-8">
          <CardHeader><CardTitle>Sign-up Settings</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Allow Public Sign-up</h3>
                <p className="text-sm text-text-secondary mt-1">When enabled, anyone can create an account (requires admin approval to activate)</p>
              </div>
              <Button onClick={toggleSignup} disabled={settingsLoading} variant={signupEnabled ? 'default' : 'secondary'}>
                {settingsLoading ? 'Updating...' : signupEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <CreateUserForm onCreated={loadUsers} onError={setError} />

        <UsersTable
          users={users}
          currentUserId={session.user.id}
          onDelete={deleteUser}
          onToggleActive={toggleUserActive}
        />
      </div>
    </ModernBackground>
  );
}
