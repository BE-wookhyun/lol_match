import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { registerStreamer } from '../api/streamers';
import { fetchSummonerTierPreview } from '../api/riot';
import { LINE_LABEL_KO, LINE_ORDER } from '../constants/tiers';
import type { Line, Streamer } from '../types';
import styles from './StreamerRegisterModal.module.css';

interface StreamerRegisterModalProps {
  onClose: () => void;
  onRegistered: (streamer: Streamer) => void;
}

export default function StreamerRegisterModal({ onClose, onRegistered }: StreamerRegisterModalProps) {
  const [streamerName, setStreamerName] = useState('');
  const [streamerId, setStreamerId] = useState('');
  const [lolId, setLolId] = useState('');
  const [lolTag, setLolTag] = useState('');
  const [line, setLine] = useState<Line>('TOP');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierPreview, setTierPreview] = useState('');
  const [checkingTier, setCheckingTier] = useState(false);
  const [tierCheckError, setTierCheckError] = useState<string | null>(null);

  function handleRiotIdChange(next: { lolId?: string; lolTag?: string }) {
    if (next.lolId !== undefined) setLolId(next.lolId);
    if (next.lolTag !== undefined) setLolTag(next.lolTag);
    setTierPreview('');
    setTierCheckError(null);
  }

  async function handleCheckTier() {
    setCheckingTier(true);
    setTierCheckError(null);
    setTierPreview('');

    try {
      const result = await fetchSummonerTierPreview(lolId, lolTag);
      setTierPreview(`${result.tier} ${result.rank}`.trim());
    } catch (err) {
      setTierCheckError(err instanceof Error ? err.message : '티어 조회에 실패했습니다.');
    } finally {
      setCheckingTier(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const streamer = await registerStreamer({ streamerName, streamerId, lolId, lolTag, line });
      onRegistered(streamer);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>스트리머 등록</h2>

        <label className={styles.field}>
          <span>스트리머명</span>
          <input value={streamerName} onChange={(e) => setStreamerName(e.target.value)} required />
        </label>

        <label className={styles.field}>
          <span>SOOP 계정 ID</span>
          <input value={streamerId} onChange={(e) => setStreamerId(e.target.value)} required />
        </label>

        <div className={styles.riotIdRow}>
          <label className={styles.field}>
            <span>롤 게임 아이디</span>
            <input
              value={lolId}
              onChange={(e) => handleRiotIdChange({ lolId: e.target.value })}
              required
            />
          </label>
          <span className={styles.hash}>#</span>
          <label className={styles.field}>
            <span>태그</span>
            <input
              value={lolTag}
              onChange={(e) => handleRiotIdChange({ lolTag: e.target.value })}
              required
            />
          </label>
        </div>

        <div className={styles.tierCheckRow}>
          <button
            type="button"
            className={styles.checkButton}
            onClick={handleCheckTier}
            disabled={!lolId || !lolTag || checkingTier}
          >
            {checkingTier ? '확인 중...' : '티어 확인'}
          </button>
          <input
            className={styles.tierPreview}
            value={tierPreview}
            placeholder="확인 버튼을 눌러 티어를 확인하세요"
            readOnly
          />
        </div>

        {tierCheckError && <p className={styles.error}>{tierCheckError}</p>}

        <label className={styles.field}>
          <span>라인</span>
          <select value={line} onChange={(e) => setLine(e.target.value as Line)}>
            {LINE_ORDER.map((l) => (
              <option key={l} value={l}>
                {LINE_LABEL_KO[l]} ({l})
              </option>
            ))}
          </select>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={submitting}>
            취소
          </button>
          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
