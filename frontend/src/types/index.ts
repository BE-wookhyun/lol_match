export type Line = 'TOP' | 'JGL' | 'MID' | 'BOT' | 'SPT';

export type TierName =
  | 'CHALLENGER'
  | 'GRANDMASTER'
  | 'MASTER'
  | 'DIAMOND'
  | 'EMERALD'
  | 'PLATINUM'
  | 'GOLD'
  | 'SILVER'
  | 'BRONZE'
  | 'IRON';

export type Division = 'I' | 'II' | 'III' | 'IV';

export interface Streamer {
  seq: number;
  streamerName: string;
  streamerIconUrl: string;
  lolId: string;
  lolTag: string;
  line: Line;
  tier: TierName;
  division?: Division;
  lp: number;
  isLive?: boolean;
  peakTier?: string;
  score?: number;
}

export type TeamLineup = Partial<Record<Line, number>>;

export interface Team {
  seq: number;
  teamName: string;
  captainSeq: number;
  lineup: TeamLineup;
  wins: number;
  losses: number;
}

export interface Match {
  seq: number;
  teamASeq: number;
  teamBSeq: number;
  winnerSeq: number;
  score: string;
  matchDate: string;
  round: number;
}
