import type { Line, Streamer, TeamLineup } from '../types';
import { LINE_ORDER } from '../constants/tiers';

export function resolveStreamerByName(streamers: Streamer[], name: string | undefined): Streamer | undefined {
  if (name === undefined) return undefined;
  return streamers.find((s) => s.streamerName === name);
}

export function toLineupSeqs(lineup: Partial<Record<Line, string>>, streamers: Streamer[]): TeamLineup {
  const result: TeamLineup = {};
  for (const line of LINE_ORDER) {
    const streamer = resolveStreamerByName(streamers, lineup[line]);
    if (streamer) result[line] = streamer.seq;
  }
  return result;
}
