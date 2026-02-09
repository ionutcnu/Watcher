import { ClanInfo, ClanSnapshot, ClanChange } from '@/types/clan';

export function detectChanges(
  previousSnapshot: ClanSnapshot | null,
  currentClan: ClanInfo
): ClanChange[] {
  if (!previousSnapshot) {
    return [];
  }

  const changes: ClanChange[] = [];
  const now = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  const previousMembers = new Map(
    previousSnapshot.members.map(m => [m.account_id, m])
  );

  const currentMembers = new Map(
    currentClan.members.map(m => [m.account_id, m])
  );

  // Detect new members (joins)
  for (const [accountId, member] of currentMembers) {
    if (!previousMembers.has(accountId)) {
      changes.push({
        type: 'join',
        player: {
          account_id: member.account_id,
          account_name: member.account_name
        },
        clan: {
          clan_id: currentClan.clan_id,
          tag: currentClan.tag,
          name: currentClan.name
        },
        timestamp: now,
        date: dateStr
      });
    }
  }

  // Detect departed members (leaves)
  for (const [accountId, member] of previousMembers) {
    if (!currentMembers.has(accountId)) {
      changes.push({
        type: 'leave',
        player: {
          account_id: member.account_id,
          account_name: member.account_name
        },
        clan: {
          clan_id: currentClan.clan_id,
          tag: currentClan.tag,
          name: currentClan.name
        },
        timestamp: now,
        date: dateStr
      });
    }
  }

  return changes;
}

export function createSnapshot(clan: ClanInfo): ClanSnapshot {
  const now = new Date();
  return {
    clan_id: clan.clan_id,
    tag: clan.tag,
    name: clan.name,
    members: clan.members,
    snapshot_date: now.toISOString().split('T')[0],
    timestamp: now.getTime()
  };
}
