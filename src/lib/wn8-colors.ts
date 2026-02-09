/** Official tomato.gg WN8 color scale */

export type WN8Tier =
  | 'very-bad'
  | 'bad'
  | 'below-avg'
  | 'average'
  | 'above-avg'
  | 'good'
  | 'very-good'
  | 'great'
  | 'unicum'
  | 'super-unicum';

interface WN8Bracket {
  min: number;
  tier: WN8Tier;
  label: string;
  /** Tailwind class using CSS variable */
  textClass: string;
  /** Tailwind class for background */
  bgClass: string;
}

const WN8_BRACKETS: WN8Bracket[] = [
  { min: 2900, tier: 'super-unicum', label: 'Super Unicum', textClass: 'text-wn8-super-unicum', bgClass: 'bg-wn8-super-unicum' },
  { min: 2450, tier: 'unicum',       label: 'Unicum',       textClass: 'text-wn8-unicum',       bgClass: 'bg-wn8-unicum' },
  { min: 2000, tier: 'great',        label: 'Great',        textClass: 'text-wn8-great',        bgClass: 'bg-wn8-great' },
  { min: 1600, tier: 'very-good',    label: 'Very Good',    textClass: 'text-wn8-very-good',    bgClass: 'bg-wn8-very-good' },
  { min: 1200, tier: 'good',         label: 'Good',         textClass: 'text-wn8-good',         bgClass: 'bg-wn8-good' },
  { min: 900,  tier: 'above-avg',    label: 'Above Average',textClass: 'text-wn8-above-avg',    bgClass: 'bg-wn8-above-avg' },
  { min: 650,  tier: 'average',      label: 'Average',      textClass: 'text-wn8-average',      bgClass: 'bg-wn8-average' },
  { min: 450,  tier: 'below-avg',    label: 'Below Average',textClass: 'text-wn8-below-avg',    bgClass: 'bg-wn8-below-avg' },
  { min: 300,  tier: 'bad',          label: 'Bad',          textClass: 'text-wn8-bad',          bgClass: 'bg-wn8-bad' },
  { min: 0,    tier: 'very-bad',     label: 'Very Bad',     textClass: 'text-wn8-very-bad',     bgClass: 'bg-wn8-very-bad' },
];

function getBracket(wn8: number): WN8Bracket {
  return WN8_BRACKETS.find(b => wn8 >= b.min) ?? WN8_BRACKETS[WN8_BRACKETS.length - 1];
}

/** Returns a Tailwind text color class for the WN8 value */
export function getWN8Color(wn8: number): string {
  return getBracket(wn8).textClass;
}

/** Returns a Tailwind bg color class for the WN8 value */
export function getWN8BgColor(wn8: number): string {
  return getBracket(wn8).bgClass;
}

/** Returns the human-readable label (e.g. "Super Unicum") */
export function getWN8Label(wn8: number): string {
  return getBracket(wn8).label;
}

/** Returns the tier key (e.g. "super-unicum") */
export function getWN8Tier(wn8: number): WN8Tier {
  return getBracket(wn8).tier;
}
