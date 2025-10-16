import fs from 'fs/promises';
import path from 'path';
import { ClanSnapshot, ClanChange } from '@/types/clan';

const DATA_DIR = path.join(process.cwd(), 'data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const CHANGES_DIR = path.join(DATA_DIR, 'changes');

async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
    await fs.mkdir(CHANGES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create directories:', error);
  }
}

export async function saveSnapshot(snapshot: ClanSnapshot): Promise<void> {
  await ensureDirectories();
  
  const filename = `clan_${snapshot.clan_id}_${snapshot.snapshot_date}.json`;
  const filepath = path.join(SNAPSHOTS_DIR, filename);
  
  await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2));
}

export async function getLatestSnapshot(clanId: number): Promise<ClanSnapshot | null> {
  await ensureDirectories();
  
  try {
    const files = await fs.readdir(SNAPSHOTS_DIR);
    const clanFiles = files
      .filter(f => f.startsWith(`clan_${clanId}_`) && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (clanFiles.length === 0) {
      return null;
    }
    
    const latestFile = path.join(SNAPSHOTS_DIR, clanFiles[0]);
    const content = await fs.readFile(latestFile, 'utf-8');
    return JSON.parse(content) as ClanSnapshot;
  } catch (error) {
    console.error(`Failed to get latest snapshot for clan ${clanId}:`, error);
    return null;
  }
}

export async function saveChanges(changes: ClanChange[]): Promise<void> {
  if (changes.length === 0) return;
  
  await ensureDirectories();
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `changes_${date}.json`;
  const filepath = path.join(CHANGES_DIR, filename);
  
  let existingChanges: ClanChange[] = [];
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    existingChanges = JSON.parse(content);
  } catch {
    // File doesn't exist, start with empty array
  }
  
  const allChanges = [...existingChanges, ...changes];
  await fs.writeFile(filepath, JSON.stringify(allChanges, null, 2));
}

export async function getRecentChanges(days: number = 7): Promise<ClanChange[]> {
  await ensureDirectories();
  
  try {
    const files = await fs.readdir(CHANGES_DIR);
    const changeFiles = files
      .filter(f => f.startsWith('changes_') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, days);
    
    const allChanges: ClanChange[] = [];
    
    for (const file of changeFiles) {
      const filepath = path.join(CHANGES_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const changes = JSON.parse(content) as ClanChange[];
      allChanges.push(...changes);
    }
    
    return allChanges.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to get recent changes:', error);
    return [];
  }
}