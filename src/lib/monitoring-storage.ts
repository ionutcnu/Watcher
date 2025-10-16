import fs from 'fs/promises';
import path from 'path';
import { MonitoredClan, MonitoringConfig, PlayerExclusionAlert } from '@/types/monitoring';

const DATA_DIR = path.join(process.cwd(), 'data');
const MONITORED_CLANS_FILE = path.join(DATA_DIR, 'monitored-clans.json');
const MONITORING_CONFIG_FILE = path.join(DATA_DIR, 'monitoring-config.json');
const EXCLUSION_ALERTS_FILE = path.join(DATA_DIR, 'exclusion-alerts.json');

async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
}

// Monitored Clans Management
export async function getMonitoredClans(): Promise<MonitoredClan[]> {
  await ensureDataDirectory();
  try {
    const content = await fs.readFile(MONITORED_CLANS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function saveMonitoredClans(clans: MonitoredClan[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(MONITORED_CLANS_FILE, JSON.stringify(clans, null, 2));
}

export async function addMonitoredClan(clan: Omit<MonitoredClan, 'added_at' | 'status'>): Promise<void> {
  const clans = await getMonitoredClans();
  
  // Check if clan already exists
  const existing = clans.find(c => c.clan_id === clan.clan_id);
  if (existing) {
    throw new Error(`Clan ${clan.tag} is already being monitored`);
  }
  
  const newClan: MonitoredClan = {
    ...clan,
    added_at: new Date().toISOString(),
    status: 'never_checked'
  };
  
  clans.push(newClan);
  await saveMonitoredClans(clans);
}

export async function removeMonitoredClan(clanId: number): Promise<void> {
  const clans = await getMonitoredClans();
  const filteredClans = clans.filter(c => c.clan_id !== clanId);
  await saveMonitoredClans(filteredClans);
}

export async function updateClanStatus(clanId: number, updates: Partial<MonitoredClan>): Promise<void> {
  const clans = await getMonitoredClans();
  const clanIndex = clans.findIndex(c => c.clan_id === clanId);
  
  if (clanIndex !== -1) {
    clans[clanIndex] = { ...clans[clanIndex], ...updates };
    await saveMonitoredClans(clans);
  }
}

// Monitoring Configuration
export async function getMonitoringConfig(): Promise<MonitoringConfig> {
  await ensureDataDirectory();
  try {
    const content = await fs.readFile(MONITORING_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      check_interval: 'daily',
      notification_types: {
        player_left: true,
        player_joined: false,
        role_changes: false
      }
    };
  }
}

export async function saveMonitoringConfig(config: MonitoringConfig): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(MONITORING_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Exclusion Alerts
export async function getExclusionAlerts(): Promise<PlayerExclusionAlert[]> {
  await ensureDataDirectory();
  try {
    const content = await fs.readFile(EXCLUSION_ALERTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function saveExclusionAlert(alert: PlayerExclusionAlert): Promise<void> {
  const alerts = await getExclusionAlerts();
  alerts.push(alert);
  
  // Keep only last 1000 alerts
  if (alerts.length > 1000) {
    alerts.splice(0, alerts.length - 1000);
  }
  
  await ensureDataDirectory();
  await fs.writeFile(EXCLUSION_ALERTS_FILE, JSON.stringify(alerts, null, 2));
}