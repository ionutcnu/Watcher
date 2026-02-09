'use client';

import { History } from 'lucide-react';
import type { ClanHistoryEvent } from '@/hooks/use-clan-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { motion } from 'framer-motion';

interface ClanHistoryPanelProps {
  selectedClan: { tag: string; name: string } | null;
  allEvents: ClanHistoryEvent[];
  filteredEvents: ClanHistoryEvent[];
  eventLimit: number;
  setEventLimit: (v: number) => void;
  eventTypeFilter: string;
  setEventTypeFilter: (v: string) => void;
  onClose: () => void;
}

export function ClanHistoryPanel({
  selectedClan, allEvents, filteredEvents,
  eventLimit, setEventLimit, eventTypeFilter, setEventTypeFilter, onClose
}: ClanHistoryPanelProps) {
  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, ClanHistoryEvent[]>);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Clan History - [{selectedClan?.tag}] {selectedClan?.name}
          </CardTitle>
          <Button onClick={onClose} variant="ghost">Close</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="text-sm text-text-secondary">
            Found {allEvents.length} events, showing {filteredEvents.length}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="event-limit" className="text-sm">Show:</Label>
              <select
                id="event-limit"
                value={eventLimit}
                onChange={(e) => setEventLimit(parseInt(e.target.value))}
                className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm"
              >
                <option value={5}>5 events</option>
                <option value={10}>10 events</option>
                <option value={25}>25 events</option>
                <option value={50}>50 events</option>
                <option value={100}>100 events</option>
                <option value={allEvents.length}>All events</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="event-filter" className="text-sm">Filter:</Label>
              <select
                id="event-filter"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm"
              >
                <option value="all">All events</option>
                <option value="join">Joins only</option>
                <option value="leave">Leaves only</option>
                <option value="role_change">Position changes only</option>
              </select>
            </div>
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-text-primary">
                    {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </h3>
                </div>
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-surface/50 border-l-4 rounded-lg overflow-hidden hover:bg-surface/80 transition-colors"
                      style={{
                        borderLeftColor: event.type === 'join' ? 'var(--success)' : event.type === 'leave' ? 'var(--danger)' : 'var(--accent-primary)'
                      }}
                    >
                      <div className="flex items-start gap-4 p-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center text-xl">
                            👤
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                            event.type === 'join' ? 'bg-success' : event.type === 'leave' ? 'bg-danger' : 'bg-accent-primary'
                          }`}>
                            {event.type === 'join' && '+'}
                            {event.type === 'leave' && '✕'}
                            {event.type === 'role_change' && '↗'}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-text-primary font-semibold">
                              {event.type === 'join' && 'Joined Clan'}
                              {event.type === 'leave' && 'Left Clan'}
                              {event.type === 'role_change' && 'Role Changed'}
                            </h4>
                            <Badge variant="outline" className="shrink-0">{event.type}</Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-2">
                            <span>
                              {new Date(event.timestamp * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                              {new Date(event.timestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.initiatorName && (
                              <>
                                <span>•</span>
                                <span className="text-warning">By {event.initiatorName}</span>
                              </>
                            )}
                          </div>

                          <p className="text-text-primary text-sm">
                            <a
                              href={`https://tomato.gg/stats/EU/${event.player.account_name}=${event.player.account_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent-primary hover:underline transition-colors font-medium"
                            >
                              {event.player.account_name}
                            </a>
                            {' '}
                            {event.type === 'join' && 'has been accepted to the clan.'}
                            {event.type === 'leave' && 'has been excluded from this clan.'}
                            {event.type === 'role_change' && event.description.includes('promoted') && 'has been promoted.'}
                            {event.type === 'role_change' && event.description.includes('demoted') && 'has been demoted.'}
                          </p>

                          {event.type === 'role_change' && event.role && (
                            <div className="mt-2">
                              <Badge className="bg-accent-primary/20 text-accent-primary border-accent-primary">
                                {event.role}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<History className="w-6 h-6" />}
            title="No history available"
            description="No historical data found for this clan. Try a different clan or check back later."
          />
        )}
      </CardContent>
    </Card>
  );
}
