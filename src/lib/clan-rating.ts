/** Clan rating tier colors based on WG league tiers */

export type ClanRatingTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'iron';

export function getClanRatingTier(rating: number): ClanRatingTier {
  if (rating >= 2000) return 'diamond';
  if (rating >= 1500) return 'gold';
  if (rating >= 1000) return 'silver';
  if (rating >= 500) return 'bronze';
  return 'iron';
}

export function getClanRatingColor(rating: number): string {
  const tier = getClanRatingTier(rating);
  switch (tier) {
    case 'diamond': return 'text-[#b9f2ff]';
    case 'gold': return 'text-[#ffd700]';
    case 'silver': return 'text-[#c0c0c0]';
    case 'bronze': return 'text-[#cd7f32]';
    case 'iron': return 'text-text-tertiary';
  }
}

export function getClanRatingLabel(rating: number): string {
  const tier = getClanRatingTier(rating);
  switch (tier) {
    case 'diamond': return 'Diamond';
    case 'gold': return 'Gold';
    case 'silver': return 'Silver';
    case 'bronze': return 'Bronze';
    case 'iron': return 'Iron';
  }
}
