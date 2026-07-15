import { LINE_PRIORITY_ORDER } from '../constants/tiers';
import type { Line, Streamer } from '../types';

export interface StreamerCombo {
  picks: Partial<Record<Line, Streamer>>;
  total: number;
}

const MAX_COMBOS_CONSIDERED = 200_000;

function candidatesForLine(streamers: Streamer[], line: Line, assignedSeqs: Set<number>): Streamer[] {
  return streamers.filter((s) => s.line === line && !assignedSeqs.has(s.seq));
}

function closestByScore(candidates: Streamer[], target: number, limit: number): Streamer[] {
  return [...candidates]
    .sort((a, b) => Math.abs((a.score ?? 0) - target) - Math.abs((b.score ?? 0) - target))
    .slice(0, limit);
}

function compareCombos(a: StreamerCombo, b: StreamerCombo, remainingScore: number, priorityLines: Line[]): number {
  const diffA = Math.abs(a.total - remainingScore);
  const diffB = Math.abs(b.total - remainingScore);
  if (diffA !== diffB) return diffA - diffB;

  for (const line of priorityLines) {
    const scoreA = a.picks[line]?.score ?? 0;
    const scoreB = b.picks[line]?.score ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
  }
  return 0;
}

export function recommendSingleLine(
  streamers: Streamer[],
  assignedSeqs: Set<number>,
  line: Line,
  remainingScore: number,
  limit = 3
): Streamer[] {
  return closestByScore(candidatesForLine(streamers, line, assignedSeqs), remainingScore, limit);
}

export function recommendCombos(
  streamers: Streamer[],
  assignedSeqs: Set<number>,
  remainingLines: Line[],
  remainingScore: number,
  limit = 5
): StreamerCombo[] {
  if (remainingLines.length === 0) return [];

  // bound the cartesian product so recommending for many empty lines at once stays fast
  const perLineCap = Math.max(5, Math.floor(MAX_COMBOS_CONSIDERED ** (1 / remainingLines.length)));
  const evenSplitTarget = remainingScore / remainingLines.length;

  const poolsByLine = remainingLines.map((line) => ({
    line,
    candidates: closestByScore(candidatesForLine(streamers, line, assignedSeqs), evenSplitTarget, perLineCap),
  }));

  if (poolsByLine.some(({ candidates }) => candidates.length === 0)) {
    return [];
  }

  let combos: StreamerCombo[] = [{ picks: {}, total: 0 }];
  for (const { line, candidates } of poolsByLine) {
    const next: StreamerCombo[] = [];
    for (const combo of combos) {
      for (const candidate of candidates) {
        next.push({
          picks: { ...combo.picks, [line]: candidate },
          total: combo.total + (candidate.score ?? 0),
        });
      }
    }
    combos = next;
  }

  const priorityLines = LINE_PRIORITY_ORDER.filter((line) => remainingLines.includes(line));
  return combos.sort((a, b) => compareCombos(a, b, remainingScore, priorityLines)).slice(0, limit);
}
