import type { Line, Streamer } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface StreamerRegisterPayload {
  streamerName: string;
  streamerId: string;
  lolId: string;
  lolTag: string;
  line: Line;
  soopChannelId?: string;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === 'string' ? body.message : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchStreamers(): Promise<Streamer[]> {
  const res = await fetch(`${API_BASE_URL}/api/streamers`);
  if (!res.ok) {
    throw new Error(`스트리머 목록을 불러오지 못했습니다. (${res.status})`);
  }
  return res.json();
}

export async function registerStreamer(payload: StreamerRegisterPayload): Promise<Streamer> {
  const res = await fetch(`${API_BASE_URL}/api/streamers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `등록에 실패했습니다. (${res.status})`));
  }

  return res.json();
}

export async function deleteStreamer(seq: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/streamers/${seq}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `삭제에 실패했습니다. (${res.status})`));
  }
}
