import type { Line } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface TeamCreatePayload {
  teamName: string;
  captainStreamerName: string;
  lineup: Partial<Record<Line, string>>;
  forceLineMismatch: boolean;
}

export interface VsRecord {
  opponentTeamName: string;
  wins: number;
  losses: number;
}

export interface TeamCreateResponse {
  seq: number;
  teamName: string;
  captainStreamerName: string;
  lineup: Partial<Record<Line, string>>;
  wins: number;
  losses: number;
  winRate: number;
  vsRecords: VsRecord[];
  createdAt: string;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === 'string' ? body.message : fallback;
  } catch {
    return fallback;
  }
}

export async function createTeam(payload: TeamCreatePayload): Promise<TeamCreateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `팀 생성에 실패했습니다. (${res.status})`));
  }

  return res.json();
}

export async function fetchTeams(): Promise<TeamCreateResponse[]> {
  const res = await fetch(`${API_BASE_URL}/api/teams`);
  if (!res.ok) {
    throw new Error(`팀 목록을 불러오지 못했습니다. (${res.status})`);
  }
  return res.json();
}

export async function deleteTeam(seq: number, adminKey: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/teams/${seq}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `팀 삭제에 실패했습니다. (${res.status})`));
  }
}

export interface TeamMatchResultPayload {
  teamName: string;
  opponentTeamName: string;
  wins: number;
  losses: number;
}

export async function recordTeamMatchResult(payload: TeamMatchResultPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/teams/match-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `대전 기록 저장에 실패했습니다. (${res.status})`));
  }
}
