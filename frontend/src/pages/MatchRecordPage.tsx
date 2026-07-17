import { useEffect, useMemo, useState } from 'react';
import LineupTable from '../components/LineupTable';
import MatchResultModal from '../components/MatchResultModal';
import { fetchTeams, recordTeamMatchResult, type TeamCreateResponse, type TeamMatchResultPayload } from '../api/teams';
import { fetchStreamers } from '../api/streamers';
import { toLineupSeqs } from '../utils/lineup';
import type { Streamer } from '../types';
import styles from './MatchRecordPage.module.css';

interface DerivedMatch {
  key: string;
  teamA: TeamCreateResponse;
  teamB: TeamCreateResponse;
  score: string;
}

function buildMatches(teams: TeamCreateResponse[]): DerivedMatch[] {
  const teamByName = new Map(teams.map((t) => [t.teamName, t]));
  const seenPairs = new Set<string>();
  const result: DerivedMatch[] = [];

  for (const team of teams) {
    for (const vs of team.vsRecords) {
      const pairKey = [team.teamName, vs.opponentTeamName].sort().join('___');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const opponent = teamByName.get(vs.opponentTeamName);
      if (!opponent) continue;

      result.push({
        key: pairKey,
        teamA: team,
        teamB: opponent,
        score: `${vs.wins}:${vs.losses}`,
      });
    }
  }

  return result;
}

export default function MatchRecordPage() {
  const [teams, setTeams] = useState<TeamCreateResponse[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | 'ALL'>('ALL');
  const [showMatchResultModal, setShowMatchResultModal] = useState(false);

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

  async function handleConfirmMatchResult(payload: TeamMatchResultPayload, adminKey: string) {
    await recordTeamMatchResult(payload, adminKey);
    const teamsRes = await fetchTeams();
    setTeams(teamsRes);
    setShowMatchResultModal(false);
  }

  const matches = useMemo(() => buildMatches(teams), [teams]);

  const filteredMatches = useMemo(() => {
    if (teamFilter === 'ALL') return matches;
    return matches.filter((m) => m.teamA.teamName === teamFilter || m.teamB.teamName === teamFilter);
  }, [matches, teamFilter]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>대결 기록</h1>

      <div className={styles.notice}>
        <span className={styles.noticeIcon}>🔔</span>
        <span className={styles.noticeText}>확정된 팀의 스크림 기록입니다</span>
      </div>

      <div className={styles.adminBar}>
        <button type="button" className={styles.adminButton} onClick={() => setShowMatchResultModal(true)}>
          전적 입력 (관리자)
        </button>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p className={styles.empty}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.filterBar}>
            <button
              type="button"
              className={teamFilter === 'ALL' ? styles.activeFilter : styles.filterButton}
              onClick={() => setTeamFilter('ALL')}
            >
              전체
            </button>
            {teams.map((team) => (
              <button
                key={team.seq}
                type="button"
                className={teamFilter === team.teamName ? styles.activeFilter : styles.filterButton}
                onClick={() => setTeamFilter(team.teamName)}
              >
                {team.teamName}
              </button>
            ))}
          </div>

          <div className={styles.matchList}>
            {filteredMatches.map((match) => (
              <div key={match.key} className={styles.matchCard}>
                <div className={styles.versusRow}>
                  <h2 className={styles.teamName}>{match.teamA.teamName}</h2>
                  <span className={styles.score}>{match.score}</span>
                  <h2 className={styles.teamName}>{match.teamB.teamName}</h2>
                </div>
                <div className={styles.lineupRow}>
                  <LineupTable
                    lineup={toLineupSeqs(match.teamA.lineup, streamers)}
                    resolveStreamer={(seq) => streamers.find((s) => s.seq === seq)}
                  />
                  <LineupTable
                    lineup={toLineupSeqs(match.teamB.lineup, streamers)}
                    resolveStreamer={(seq) => streamers.find((s) => s.seq === seq)}
                  />
                </div>
              </div>
            ))}
            {filteredMatches.length === 0 && <p className={styles.empty}>해당 팀의 대결 기록이 없습니다.</p>}
          </div>
        </>
      )}

      {showMatchResultModal && (
        <MatchResultModal
          teams={teams}
          onConfirm={handleConfirmMatchResult}
          onClose={() => setShowMatchResultModal(false)}
        />
      )}
    </div>
  );
}
