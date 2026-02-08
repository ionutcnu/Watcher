'use client';

import { ClanChange } from '@/types/clan';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScanResult {
  success: boolean;
  clan?: {
    clan_id: number;
    tag: string;
    name: string;
    members: Array<{ account_id: number; account_name: string; joined_at: number; role: string }>;
  };
  changes?: ClanChange[];
  summary?: { total_members: number; joins: number; leaves: number };
}

interface ScanResultsPanelProps {
  scanResult: ScanResult;
}

export function ScanResultsPanel({ scanResult }: ScanResultsPanelProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Scan Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Members" value={scanResult.summary?.total_members || 0} delay={0.1} />
          <StatCard title="New Joins" value={scanResult.summary?.joins || 0} delay={0.2} />
          <StatCard title="Leaves" value={scanResult.summary?.leaves || 0} delay={0.3} />
        </div>

        {scanResult.clan && (
          <div>
            <h3 className="font-medium text-text-primary">
              [{scanResult.clan.tag}] {scanResult.clan.name}
            </h3>
            <p className="text-sm text-text-secondary">Clan ID: {scanResult.clan.clan_id}</p>
          </div>
        )}

        {scanResult.changes && scanResult.changes.length > 0 && (
          <div>
            <h3 className="font-medium text-text-primary mb-3">Recent Changes</h3>
            <div className="space-y-2">
              {scanResult.changes.map((change, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    change.type === 'join' ? 'bg-success/10 border-success' : 'bg-danger/10 border-danger'
                  }`}
                >
                  <Badge variant={change.type === 'join' ? 'default' : 'destructive'} className="mr-2">
                    {change.type.toUpperCase()}
                  </Badge>
                  <span className="font-medium text-text-primary">{change.player.account_name}</span>
                  <span className="text-text-secondary text-sm ml-2">({change.player.account_id})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
