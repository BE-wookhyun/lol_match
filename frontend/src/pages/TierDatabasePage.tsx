import { useEffect, useMemo, useState } from 'react';
import ShortcutBar from '../components/ShortcutBar';
import TierSection from '../components/TierSection';
import LineSection from '../components/LineSection';
import ViewToggle from '../components/ViewToggle';
import StreamerRegisterModal from '../components/StreamerRegisterModal';
import AdminKeyModal from '../components/AdminKeyModal';
import { deleteStreamer, fetchStreamers } from '../api/streamers';
import { GRADE_ORDER, LINE_ORDER } from '../constants/tiers';
import type { Streamer } from '../types';
import styles from './TierDatabasePage.module.css';

export default function TierDatabasePage() {
  const [groupBy, setGroupBy] = useState<'tier' | 'line'>('tier');
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Streamer | null>(null);

  function loadStreamers() {
    setLoading(true);
    setError(null);
    return fetchStreamers()
      .then(setStreamers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStreamers();
  }, []);

  async function handleConfirmDeleteStreamer(adminKey: string) {
    if (!deleteTarget) return;
    await deleteStreamer(deleteTarget.seq, adminKey);
    setDeleteTarget(null);
    loadStreamers();
  }

  const byTier = useMemo(() => {
    return GRADE_ORDER.map((grade) => ({
      grade,
      list: streamers.filter((s) => s.peakTier === grade),
    })).filter((group) => group.list.length > 0);
  }, [streamers]);

  const byLine = useMemo(() => {
    return LINE_ORDER.map((line) => ({
      line,
      list: streamers.filter((s) => s.line === line),
    })).filter((group) => group.list.length > 0);
  }, [streamers]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>SOOP 멸망전 스트리머 등급 데이터베이스</h1>
        <button type="button" className={styles.registerButton} onClick={() => setShowRegisterModal(true)}>
          DB 등록하기
        </button>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.toolbar}>
            <ViewToggle value={groupBy} onChange={setGroupBy} />
            {groupBy === 'tier' ? (
              <ShortcutBar mode="tier" items={byTier.map((g) => g.grade)} />
            ) : (
              <ShortcutBar mode="line" items={byLine.map((g) => g.line)} />
            )}
          </div>

          {groupBy === 'tier'
            ? byTier.map((group) => (
                <TierSection
                  key={group.grade}
                  grade={group.grade}
                  streamers={group.list}
                  onDeleteStreamer={setDeleteTarget}
                />
              ))
            : byLine.map((group) => (
                <LineSection
                  key={group.line}
                  line={group.line}
                  streamers={group.list}
                  onDeleteStreamer={setDeleteTarget}
                />
              ))}
        </>
      )}

      {showRegisterModal && (
        <StreamerRegisterModal
          onClose={() => setShowRegisterModal(false)}
          onRegistered={() => {
            setShowRegisterModal(false);
            loadStreamers();
          }}
        />
      )}

      {deleteTarget && (
        <AdminKeyModal
          message={`${deleteTarget.streamerName}님을 삭제하시겠습니까?`}
          onConfirm={handleConfirmDeleteStreamer}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
