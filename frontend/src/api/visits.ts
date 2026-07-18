const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function recordVisit(): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/api/visits`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`방문자 수를 기록하지 못했습니다. (${res.status})`);
  }
  const data = await res.json();
  return data.count;
}
