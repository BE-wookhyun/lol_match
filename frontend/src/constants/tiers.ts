import type { Line, TierName } from '../types';

export const TIER_ORDER: TierName[] = [
  'CHALLENGER',
  'GRANDMASTER',
  'MASTER',
  'DIAMOND',
  'EMERALD',
  'PLATINUM',
  'GOLD',
  'SILVER',
  'BRONZE',
  'IRON',
];

export const TIER_LABEL_KO: Record<TierName, string> = {
  CHALLENGER: '챌린저',
  GRANDMASTER: '그랜드마스터',
  MASTER: '마스터',
  DIAMOND: '다이아',
  EMERALD: '에메랄드',
  PLATINUM: '플래티넘',
  GOLD: '골드',
  SILVER: '실버',
  BRONZE: '브론즈',
  IRON: '아이언',
};

export const TIER_COLOR_VAR: Record<TierName, string> = {
  CHALLENGER: '--tier-challenger',
  GRANDMASTER: '--tier-grandmaster',
  MASTER: '--tier-master',
  DIAMOND: '--tier-diamond',
  EMERALD: '--tier-emerald',
  PLATINUM: '--tier-platinum',
  GOLD: '--tier-gold',
  SILVER: '--tier-silver',
  BRONZE: '--tier-bronze',
  IRON: '--tier-iron',
};

export const TIER_BG_VAR: Record<TierName, string> = {
  CHALLENGER: '--tier-challenger-bg',
  GRANDMASTER: '--tier-grandmaster-bg',
  MASTER: '--tier-master-bg',
  DIAMOND: '--tier-diamond-bg',
  EMERALD: '--tier-emerald-bg',
  PLATINUM: '--tier-platinum-bg',
  GOLD: '--tier-gold-bg',
  SILVER: '--tier-silver-bg',
  BRONZE: '--tier-bronze-bg',
  IRON: '--tier-iron-bg',
};

export const GRADE_ORDER: string[] = [
  'Transcended', 'God', 'Legendary', 'Unique', 'SSR', 'SR', 'R',
  'S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-',
  'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E+', 'E', 'E-', 'F+', 'F', 'F-',
];

export const LINE_ORDER: Line[] = ['TOP', 'JGL', 'MID', 'BOT', 'SPT'];

export const LINE_PRIORITY_ORDER: Line[] = ['JGL', 'MID', 'BOT', 'TOP', 'SPT'];

export const LINE_LABEL_KO: Record<Line, string> = {
  TOP: '탑',
  JGL: '정글',
  MID: '미드',
  BOT: '원딜',
  SPT: '서포터',
};

export function formatRank(
  tier: TierName | null | undefined,
  division: string | undefined,
  lp: number | null | undefined
): string {
  if (!tier) {
    return '언랭';
  }
  const hasNoDivision = tier === 'CHALLENGER' || tier === 'GRANDMASTER' || tier === 'MASTER';
  if (hasNoDivision) {
    return `${TIER_LABEL_KO[tier]} ${lp ?? 0}`;
  }
  return `${TIER_LABEL_KO[tier]} ${division ?? ''}`.trim();
}
