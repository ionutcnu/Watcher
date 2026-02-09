'use client';

import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

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

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  onDelete: (userId: string, email: string) => void;
  onToggleActive: (userId: string, currentActive: boolean) => void;
}

export function UsersTable({ users, currentUserId, onDelete, onToggleActive }: UsersTableProps) {
  return (
    <Card variant="primary">
      <CardHeader>
        <CardTitle>Users ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No users found"
            description="No registered users yet. Create the first user account to get started."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">{user.email}</div>
                      {currentUserId === user.id && <div className="text-xs text-accent-primary">(You)</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{user.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{user.username || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active === 1 ? 'bg-green-800 text-green-300' : 'bg-yellow-800 text-yellow-300'
                      }`}>
                        {user.active === 1 ? 'Active' : 'Pending Approval'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => onToggleActive(user.id, user.active === 1)} variant="secondary" size="sm" disabled={currentUserId === user.id}>
                          {user.active === 1 ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button onClick={() => onDelete(user.id, user.email)} variant="secondary" size="sm" disabled={currentUserId === user.id}>
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
  );
}
