import { useEffect, useState } from 'react';
import { cheerTeam, connectRankingSocket, fetchMyCheer, type TeamRanking } from '../api/cheers';
import type { TeamCreateResponse } from '../api/teams';
import styles from './TeamRankingPanel.module.css';

interface TeamRankingPanelProps {
  teams: TeamCreateResponse[];
}

export default function TeamRankingPanel({ teams }: TeamRankingPanelProps) {
  const [ranking, setRanking] = useState<TeamRanking[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyCheer()
      .then(setMyVote)
      .catch(() => {});

    const disconnect = connectRankingSocket(setRanking);
    return disconnect;
  }, []);

  async function handleCheer(seq: number) {
    const previousVote = myVote;
    setMyVote(seq);
    setError(null);
    try {
      const updatedRanking = await cheerTeam(seq);
      setRanking(updatedRanking);
    } catch (err) {
      setMyVote(previousVote);
      setError(err instanceof Error ? err.message : '응원 등록에 실패했습니다.');
    }
  }

  return (
    <aside className={styles.panel}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>내가 응원하는 팀</h2>
        {teams.length === 0 && <p className={styles.emptyText}>응원할 팀이 아직 없습니다.</p>}
        <ul className={styles.cheerList}>
          {teams.map((team) => (
            <li key={team.seq} className={styles.cheerItem}>
              <label className={styles.cheerLabel}>
                <input
                  type="radio"
                  name="cheer-team"
                  checked={myVote === team.seq}
                  onChange={() => handleCheer(team.seq)}
                />
                <span>{team.teamName}</span>
              </label>
            </li>
          ))}
        </ul>
        {error && <p className={styles.errorText}>{error}</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>실시간 순위</h2>
        {ranking.length === 0 && <p className={styles.emptyText}>집계된 응원이 없습니다.</p>}
        <ol className={styles.rankList}>
          {ranking.map((item, index) => (
            <li key={item.teamSeq} className={styles.rankItem}>
              <span className={`${styles.rankNumber} ${index < 3 ? styles.rankNumberTop : ''}`}>{index + 1}</span>
              <span className={styles.rankName}>{item.teamName}</span>
              <span className={styles.rankCount}>{item.cheerCount}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
