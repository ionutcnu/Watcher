'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateUserFormProps {
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function CreateUserForm({ onCreated, onError }: CreateUserFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [creating, setCreating] = useState(false);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    onError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email, password,
          name: name || undefined,
          username: username || undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setEmail(''); setPassword(''); setName(''); setUsername('');
        setShowForm(false);
        onCreated();
      } else {
        onError(result.error || 'Failed to create user');
      }
    } catch {
      onError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create New User</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} variant="secondary" size="sm">
            {showForm ? 'Cancel' : '+ Add User'}
          </Button>
        </div>
      </CardHeader>
      {showForm && (
        <CardContent>
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" />
              </div>
            </div>
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
