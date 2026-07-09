const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface SummonerTierPreview {
  gameName: string;
  tagLine: string;
  tier: string;
  rank: string;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === 'string' ? body.message : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchSummonerTierPreview(gameName: string, tagLine: string): Promise<SummonerTierPreview> {
  const params = new URLSearchParams({ gameName, tagLine });
  const res = await fetch(`${API_BASE_URL}/api/v1/riot/summoner?${params.toString()}`);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `티어 조회에 실패했습니다. (${res.status})`));
  }

  return res.json();
}
