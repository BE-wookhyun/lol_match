import { useState } from 'react';
import Modal from './Modal';
import type { TeamCreateResponse, TeamMatchResultPayload } from '../api/teams';
import styles from './MatchResultModal.module.css';

interface MatchResultModalProps {
  teams: TeamCreateResponse[];
  onConfirm: (payload: TeamMatchResultPayload, adminKey: string) => Promise<void>;
  onClose: () => void;
}

export default function MatchResultModal({ teams, onConfirm, onClose }: MatchResultModalProps) {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!team1 || !team2) {
      setError('두 팀을 모두 선택해주세요.');
      return;
    }
    if (team1 === team2) {
      setError('서로 다른 팀을 선택해주세요.');
      return;
    }
    const wins = Number(score1);
    const losses = Number(score2);
    if (!Number.isInteger(wins) || !Number.isInteger(losses) || wins < 0 || losses < 0) {
      setError('스코어는 0 이상의 정수로 입력해주세요.');
      return;
    }
    if (!adminKey.trim()) {
      setError('관리자 키를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onConfirm({ teamName: team1, opponentTeamName: team2, wins, losses }, adminKey.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '전적 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <p className={styles.message}>대결 전적을 입력하세요.</p>

      <div className={styles.matchupRow}>
        <label className={styles.label}>
          팀 1
          <select value={team1} onChange={(e) => setTeam1(e.target.value)}>
            <option value="">선택</option>
            {teams.map((team) => (
              <option key={team.seq} value={team.teamName}>
                {team.teamName}
              </option>
            ))}
          </select>
        </label>
        <input
          className={styles.scoreInput}
          type="number"
          min={0}
          value={score1}
          onChange={(e) => setScore1(e.target.value)}
          placeholder="0"
        />
        <span className={styles.colon}>:</span>
        <input
          className={styles.scoreInput}
          type="number"
          min={0}
          value={score2}
          onChange={(e) => setScore2(e.target.value)}
          placeholder="0"
        />
        <label className={styles.label}>
          팀 2
          <select value={team2} onChange={(e) => setTeam2(e.target.value)}>
            <option value="">선택</option>
            {teams.map((team) => (
              <option key={team.seq} value={team.teamName}>
                {team.teamName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.label}>
        관리자 키
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="관리자 키를 입력하세요"
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.confirm} onClick={handleSubmit} disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
        <button type="button" className={styles.cancel} onClick={onClose} disabled={submitting}>
          취소
        </button>
      </div>
    </Modal>
  );
}
