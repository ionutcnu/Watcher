'use client';

import { ClanChange } from '@/types/clan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface RecentChangesPanelProps {
  recentChanges: ClanChange[];
  lastScannedClan: { clan_id: number; tag: string; name: string } | null;
  onExport: () => void;
  hasExportData: boolean;
}

export function RecentChangesPanel({ recentChanges, lastScannedClan, onExport, hasExportData }: RecentChangesPanelProps) {
  const displayChanges = lastScannedClan
    ? recentChanges.filter(change => change.clan.clan_id === lastScannedClan.clan_id)
    : recentChanges;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {lastScannedClan
              ? `Recent Changes - [${lastScannedClan.tag}] ${lastScannedClan.name}`
              : 'Recent Changes (7 days)'}
          </CardTitle>
          <Button onClick={onExport} disabled={!hasExportData} variant="secondary">
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {displayChanges.length > 0 ? (
          <div className="space-y-3">
            {displayChanges.slice(0, 10).map((change, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-4 bg-surface/50 rounded-lg hover:bg-surface/80 transition-colors border border-border/40"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Badge variant={change.type === 'join' ? 'default' : 'destructive'}>
                    {change.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      <a
                        href={`https://tomato.gg/stats/EU/${change.player.account_name}=${change.player.account_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-primary hover:underline transition-colors"
                      >
                        {change.player.account_name}
                      </a>
                    </p>
                    <p className="text-sm text-text-secondary">
                      [{change.clan.tag}] {change.clan.name}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-text-tertiary whitespace-nowrap">
                  {change.date}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              {lastScannedClan
                ? `No recent changes found for [${lastScannedClan.tag}] ${lastScannedClan.name}.`
                : 'No recent changes found. Scan some clans to see activity.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
