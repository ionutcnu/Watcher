import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitoring Dashboard',
  description: 'Monitor your tracked WoT clans — view member changes, scan history, and real-time movement intel across all watched clans.',
  robots: { index: false, follow: false },
};

export default function MonitoringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
