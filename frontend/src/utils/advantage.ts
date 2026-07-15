import { GRADE_ORDER } from '../constants/tiers';
import type { Streamer } from '../types';

const S_PLUS = 'S+';
const A_MINUS = 'A-';

export interface ComboAdvantage {
  score: number;
  label: string | null;
}

function gradeRank(grade: string | undefined): number {
  if (!grade) return Infinity;
  const idx = GRADE_ORDER.indexOf(grade);
  return idx === -1 ? Infinity : idx;
}

function isAtLeast(grade: string | undefined, threshold: string): boolean {
  return gradeRank(grade) <= gradeRank(threshold);
}

// 팀 내 정글/원딜 포지션이 각각 서포터와 함께 S+ 이상(또는 A- 이상) 조합일 때만 성립하며,
// 가장 큰 어드밴티지 1개만 반영된다 (중복 적용되지 않음)
export function calculateComboAdvantage(
  jungle: Streamer | undefined,
  bot: Streamer | undefined,
  support: Streamer | undefined
): ComboAdvantage {
  const candidates: ComboAdvantage[] = [];

  if (isAtLeast(jungle?.peakTier, S_PLUS) && isAtLeast(support?.peakTier, S_PLUS)) {
    candidates.push({ score: -5, label: '정글·서포터 S+ 이상' });
  }
  if (isAtLeast(bot?.peakTier, S_PLUS) && isAtLeast(support?.peakTier, S_PLUS)) {
    candidates.push({ score: -5, label: '원딜·서포터 S+ 이상' });
  }
  if (isAtLeast(jungle?.peakTier, A_MINUS) && isAtLeast(support?.peakTier, A_MINUS)) {
    candidates.push({ score: -3, label: '정글·서포터 A- 이상' });
  }
  if (isAtLeast(bot?.peakTier, A_MINUS) && isAtLeast(support?.peakTier, A_MINUS)) {
    candidates.push({ score: -3, label: '원딜·서포터 A- 이상' });
  }

  if (candidates.length === 0) return { score: 0, label: null };
  return candidates.reduce((best, c) => (c.score < best.score ? c : best));
}
