'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { ModernBackground } from '@/components/ui/modern-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TacticalLoader } from '@/components/ui/tactical-loader';
import Link from 'next/link';

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
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [creating, setCreating] = useState(false);

  // Settings state
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadUsers();
      loadSettings();
    }
  }, [session]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const result = await response.json();

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: newEmail,
          password: newPassword,
          name: newName || undefined,
          username: newUsername || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setNewEmail('');
        setNewPassword('');
        setNewName('');
        setNewUsername('');
        setShowCreateForm(false);

        // Reload users
        await loadUsers();
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadUsers();
      } else {
        alert(result.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          userId,
          active: !currentActive,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadUsers();
      } else {
        alert(result.error || 'Failed to toggle user status');
      }
    } catch (err) {
      console.error('Failed to toggle user:', err);
      alert('Failed to toggle user status');
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();

      if (result.success) {
        setSignupEnabled(result.settings.signupEnabled);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const toggleSignup = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signupEnabled: !signupEnabled,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSignupEnabled(!signupEnabled);
      } else {
        alert(result.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to toggle signup:', err);
      alert('Failed to update settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isPending || loading) {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <TacticalLoader variant="turret" size="lg" color="green" message="Loading Admin Panel..." />
      </ModernBackground>
    );
  }

  // Show login prompt if not authenticated
  if (!session?.user) {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-text-secondary">
              You need to be signed in to access the admin panel.
            </p>
            <Button asChild className="w-full">
              <Link href="/">
                Go to Home Page
              </Link>
            </Button>
          </CardContent>
        </Card>
      </ModernBackground>
    );
  }

  // Show error if not admin
  if (error === 'Access denied. Admin privileges required.') {
    return (
      <ModernBackground className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-500">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-text-secondary">
              You don&apos;t have permission to access the admin panel.
            </p>
            <p className="text-text-tertiary text-sm">
              Contact the system administrator if you need access.
            </p>
            <Button asChild className="w-full">
              <Link href="/">
                Go to Home Page
              </Link>
            </Button>
          </CardContent>
        </Card>
      </ModernBackground>
    );
  }

  return (
    <ModernBackground>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-text-secondary">User Management</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>

        {/* Error Message */}
        {error && error !== 'Access denied. Admin privileges required.' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Sign-up Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sign-up Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Allow Public Sign-up</h3>
                <p className="text-sm text-text-secondary mt-1">
                  When enabled, anyone can create an account (requires admin approval to activate)
                </p>
              </div>
              <Button
                onClick={toggleSignup}
                disabled={settingsLoading}
                variant={signupEnabled ? 'default' : 'secondary'}
              >
                {settingsLoading ? 'Updating...' : signupEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create User Form */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New User</CardTitle>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="secondary"
                size="sm"
              >
                {showCreateForm ? 'Cancel' : '+ Add User'}
              </Button>
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="johndoe"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-text-tertiary text-center py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-primary">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-primary divide-y divide-border-primary">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text-primary">{user.email}</div>
                          {session?.user.id === user.id && (
                            <div className="text-xs text-accent-primary">(You)</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {user.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {user.username || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.active === 1
                                ? 'bg-green-800 text-green-300'
                                : 'bg-yellow-800 text-yellow-300'
                            }`}
                          >
                            {user.active === 1 ? 'Active' : 'Pending Approval'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => toggleUserActive(user.id, user.active === 1)}
                              variant="secondary"
                              size="sm"
                              disabled={session?.user.id === user.id}
                            >
                              {user.active === 1 ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              onClick={() => deleteUser(user.id, user.email)}
                              variant="secondary"
                              size="sm"
                              disabled={session?.user.id === user.id}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernBackground>
  );
}
