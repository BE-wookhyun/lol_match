const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface TeamRanking {
  teamSeq: number;
  teamName: string;
  cheerCount: number;
}

export async function fetchMyCheer(): Promise<number | null> {
  const res = await fetch(`${API_BASE_URL}/api/teams/cheer/me`);
  if (!res.ok) {
    throw new Error(`응원 팀 정보를 불러오지 못했습니다. (${res.status})`);
  }
  const data = await res.json();
  return data.teamSeq ?? null;
}

export async function cheerTeam(seq: number): Promise<TeamRanking[]> {
  const res = await fetch(`${API_BASE_URL}/api/teams/${seq}/cheer`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`응원 등록에 실패했습니다. (${res.status})`);
  }
  return res.json();
}

function rankingSocketUrl(): string {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/api/ws/team-ranking`;
}

export function connectRankingSocket(onRanking: (ranking: TeamRanking[]) => void): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedByCaller = false;

  function connect() {
    socket = new WebSocket(rankingSocketUrl());

    socket.onmessage = (event) => {
      try {
        const ranking = JSON.parse(event.data) as TeamRanking[];
        onRanking(ranking);
      } catch {
        // 메시지 파싱 실패는 무시하고 다음 브로드캐스트를 기다림
      }
    };

    socket.onclose = () => {
      if (!closedByCaller) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };
  }

  connect();

  return () => {
    closedByCaller = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
}
