import { useEffect, useState } from 'react';
import LineupTable from '../components/LineupTable';
import AdminKeyModal from '../components/AdminKeyModal';
import { deleteTeam, fetchTeams, type TeamCreateResponse } from '../api/teams';
import { fetchStreamers } from '../api/streamers';
import { toLineupSeqs } from '../utils/lineup';
import type { Streamer } from '../types';
import styles from './TeamListPage.module.css';

export default function TeamListPage() {
  const [teams, setTeams] = useState<TeamCreateResponse[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamCreateResponse | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchTeams(), fetchStreamers()])
      .then(([teamsRes, streamersRes]) => {
        setTeams(teamsRes);
        setStreamers(streamersRes);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirmDeleteTeam(adminKey: string) {
    if (!deleteTarget) return;
    await deleteTeam(deleteTarget.seq, adminKey);
    setTeams((prev) => prev.filter((t) => t.seq !== deleteTarget.seq));
    setDeleteTarget(null);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>구성된 팀 목록</h1>

      {loading && <p>불러오는 중...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && teams.length === 0 && (
        <p className={styles.emptyText}>아직 구성된 팀이 없습니다.</p>
      )}

      <div className={styles.grid}>
        {teams.map((team) => (
          <div key={team.seq} className={styles.card} onDoubleClick={() => setDeleteTarget(team)}>
            <div className={styles.cardHeader}>
              <h2 className={styles.teamName}>{team.teamName}</h2>
              <span className={styles.captainBadge}>팀장: {team.captainStreamerName}</span>
            </div>
            <p className={styles.record}>
              {team.wins}승 {team.losses}패 · 승률 {team.winRate.toFixed(1)}%
            </p>
            <LineupTable
              lineup={toLineupSeqs(team.lineup, streamers)}
              resolveStreamer={(seq) => streamers.find((s) => s.seq === seq)}
              compact
            />
          </div>
        ))}
      </div>

      {deleteTarget && (
        <AdminKeyModal
          message={`${deleteTarget.teamName} 팀을 삭제하시겠습니까?`}
          onConfirm={handleConfirmDeleteTeam}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
