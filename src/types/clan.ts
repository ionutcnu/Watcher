export interface ClanMember {
  account_id: number;
  account_name: string;
  joined_at: number;
  role: string;
}

export interface ClanInfo {
  clan_id: number;
  tag: string;
  name: string;
  members: ClanMember[];
}

export interface ClanChange {
  type: 'join' | 'leave';
  player: {
    account_id: number;
    account_name: string;
  };
  clan: {
    clan_id: number;
    tag: string;
    name: string;
  };
  timestamp: number;
  date: string;
}

export interface ClanSnapshot {
  clan_id: number;
  tag: string;
  name: string;
  members: ClanMember[];
  snapshot_date: string;
  timestamp: number;
}