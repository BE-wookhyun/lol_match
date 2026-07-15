import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { toPng } from 'html-to-image';
import DraggableStreamerCard from '../components/DraggableStreamerCard';
import StreamerCard from '../components/StreamerCard';
import LineupTable from '../components/LineupTable';
import Modal from '../components/Modal';
import RecommendModal from '../components/RecommendModal';
import { fetchStreamers } from '../api/streamers';
import { createTeam } from '../api/teams';
import { LINE_ORDER, LINE_LABEL_KO, TIER_ORDER, TIER_LABEL_KO } from '../constants/tiers';
import { recommendCombos, recommendSingleLine, type StreamerCombo } from '../utils/recommend';
import type { Line, Streamer, TeamLineup, TierName } from '../types';
import styles from './TeamBuildPage.module.css';

const MAX_TOTAL_SCORE = 182;

export default function TeamBuildPage() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lineFilter, setLineFilter] = useState<Line | 'ALL'>('ALL');
  const [tierFilter, setTierFilter] = useState<TierName | 'ALL' | 'UNRANKED'>('ALL');
  const [scoreFilter, setScoreFilter] = useState<number | 'ALL'>('ALL');
  const [nameFilter, setNameFilter] = useState('');

  const [teamName, setTeamName] = useState('');
  const [captainInput, setCaptainInput] = useState('');
  const [captain, setCaptain] = useState<Streamer | null>(null);
  const [captainError, setCaptainError] = useState('');

  const [lineup, setLineup] = useState<TeamLineup>({});
  const [activeStreamer, setActiveStreamer] = useState<Streamer | null>(null);
  const [mismatch, setMismatch] = useState<{ line: Line; streamer: Streamer } | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultStep, setResultStep] = useState<'name' | 'result'>('name');
  const [teamNameError, setTeamNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendSingle, setRecommendSingle] = useState<Streamer[] | null>(null);
  const [recommendCombosResult, setRecommendCombosResult] = useState<StreamerCombo[] | null>(null);

  const captureRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchStreamers()
      .then(setStreamers)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function resolveStreamer(seq: number | undefined): Streamer | undefined {
    if (seq === undefined) return undefined;
    return streamers.find((s) => s.seq === seq);
  }

  const assignedSeqs = useMemo(() => new Set(Object.values(lineup)), [lineup]);

  const scoreBuckets = useMemo(() => {
    const maxScore = streamers.reduce((max, s) => Math.max(max, s.score ?? 0), 0);
    const bucketCount = Math.max(1, Math.ceil(maxScore / 10));
    return Array.from({ length: bucketCount }, (_, i) => {
      const min = i === 0 ? 0 : i * 10 + 1;
      const max = (i + 1) * 10;
      return { min, max, label: `${min}~${max}` };
    });
  }, [streamers]);

  const pool = useMemo(() => {
    const keyword = nameFilter.trim().toLowerCase();
    return streamers.filter((s) => {
      if (assignedSeqs.has(s.seq)) return false;
      if (lineFilter !== 'ALL' && s.line !== lineFilter) return false;
      if (tierFilter === 'UNRANKED' && s.tier) return false;
      if (tierFilter !== 'ALL' && tierFilter !== 'UNRANKED' && s.tier !== tierFilter) return false;
      if (scoreFilter !== 'ALL') {
        const bucket = scoreBuckets[scoreFilter];
        const score = s.score ?? 0;
        if (!bucket || score < bucket.min || score > bucket.max) return false;
      }
      if (keyword !== '' && !s.streamerName.toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [streamers, lineFilter, tierFilter, scoreFilter, nameFilter, scoreBuckets, assignedSeqs]);

  const totalScore = useMemo(() => {
    return LINE_ORDER.reduce((sum, line) => {
      const streamer = resolveStreamer(lineup[line]);
      return sum + (streamer?.score ?? 0);
    }, 0);
  }, [lineup, streamers]);

  const isOverScoreLimit = totalScore > MAX_TOTAL_SCORE;
  const remainingScore = MAX_TOTAL_SCORE - totalScore;
  const remainingLines = useMemo(
    () => LINE_ORDER.filter((line) => lineup[line] === undefined),
    [lineup]
  );

  const canBuild =
    teamName.trim() !== '' &&
    captain !== null &&
    LINE_ORDER.every((line) => lineup[line] !== undefined) &&
    !isOverScoreLimit;

  function handleCaptainConfirm() {
    const found = streamers.find((s) => s.streamerName === captainInput.trim());
    if (!found) {
      setCaptainError('데이터베이스에 등록된 스트리머명이 아닙니다.');
      setCaptain(null);
      return;
    }
    setCaptainError('');
    setCaptain(found);
    setLineup((prev) => ({ ...prev, [found.line]: found.seq }));
  }

  function handleDragStart(event: DragStartEvent) {
    const streamer = event.active.data.current?.streamer as Streamer | undefined;
    setActiveStreamer(streamer ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveStreamer(null);
    const { active, over } = event;
    if (!over) return;
    const line = over.data.current?.line as Line | undefined;
    const streamer = active.data.current?.streamer as Streamer | undefined;
    if (!line || !streamer) return;

    if (streamer.line === line) {
      setLineup((prev) => ({ ...prev, [line]: streamer.seq }));
    } else {
      setMismatch({ line, streamer });
    }
  }

  function confirmMismatch() {
    if (!mismatch) return;
    setLineup((prev) => ({ ...prev, [mismatch.line]: mismatch.streamer.seq }));
    setMismatch(null);
  }

  function handleRemove(line: Line) {
    setLineup((prev) => {
      const next = { ...prev };
      delete next[line];
      return next;
    });
  }

  function openRecommendModal() {
    if (remainingLines.length === 0) return;

    if (remainingLines.length === 1) {
      setRecommendSingle(recommendSingleLine(streamers, assignedSeqs, remainingLines[0], remainingScore));
      setRecommendCombosResult(null);
    } else {
      setRecommendCombosResult(recommendCombos(streamers, assignedSeqs, remainingLines, remainingScore));
      setRecommendSingle(null);
    }
    setRecommendOpen(true);
  }

  function closeRecommendModal() {
    setRecommendOpen(false);
    setRecommendSingle(null);
    setRecommendCombosResult(null);
  }

  function handleSelectSingleRecommendation(streamer: Streamer) {
    setLineup((prev) => ({ ...prev, [streamer.line]: streamer.seq }));
    closeRecommendModal();
  }

  function handleSelectComboRecommendation(combo: StreamerCombo) {
    setLineup((prev) => {
      const next = { ...prev };
      for (const line of remainingLines) {
        const streamer = combo.picks[line];
        if (streamer) next[line] = streamer.seq;
      }
      return next;
    });
    closeRecommendModal();
  }

  function openResultModal() {
    setTeamNameError('');
    setSaveError('');
    setSaved(false);
    setResultStep('name');
    setResultOpen(true);
  }

  function closeResultModal() {
    setResultOpen(false);
    setResultStep('name');
    setTeamNameError('');
    setSaveError('');
    setSaved(false);
  }

  function handleConfirmTeamName() {
    if (teamName.trim() === '') {
      setTeamNameError('팀명을 입력해주세요.');
      return;
    }
    setTeamNameError('');
    setResultStep('result');
  }

  async function handleConfirmResult() {
    if (!canBuild || !captain) {
      closeResultModal();
      return;
    }

    const lineupPayload: Partial<Record<Line, string>> = {};
    for (const line of LINE_ORDER) {
      const streamer = resolveStreamer(lineup[line]);
      if (streamer) lineupPayload[line] = streamer.streamerName;
    }

    setSaving(true);
    setSaveError('');
    try {
      await createTeam({
        teamName: teamName.trim(),
        captainStreamerName: captain.streamerName,
        lineup: lineupPayload,
        forceLineMismatch: true,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '팀 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCapture() {
    if (!captureRef.current) return;
    const dataUrl = await toPng(captureRef.current, { pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${teamName || 'team'}-lineup.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.page}>
        <h1 className={styles.title}>팀 구성하기</h1>

        {loading && <p>불러오는 중...</p>}
        {loadError && <p className={styles.errorText}>{loadError}</p>}

        <div className={styles.layout}>
          <aside className={styles.poolPanel}>
            <div className={styles.filters}>
              <label className={styles.filterLabel}>
                닉네임
                <input
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="스트리머 닉네임 검색"
                />
              </label>
              <label className={styles.filterLabel}>
                라인
                <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value as Line | 'ALL')}>
                  <option value="ALL">전체</option>
                  {LINE_ORDER.map((line) => (
                    <option key={line} value={line}>
                      {LINE_LABEL_KO[line]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.filterLabel}>
                티어
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as TierName | 'ALL' | 'UNRANKED')}
                >
                  <option value="ALL">전체</option>
                  {TIER_ORDER.map((tier) => (
                    <option key={tier} value={tier}>
                      {TIER_LABEL_KO[tier]}
                    </option>
                  ))}
                  <option value="UNRANKED">언랭</option>
                </select>
              </label>
              <label className={styles.filterLabel}>
                점수
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                >
                  <option value="ALL">전체</option>
                  {scoreBuckets.map((bucket, i) => (
                    <option key={i} value={i}>
                      {bucket.label}점
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.pool}>
              {pool.map((streamer) => (
                <DraggableStreamerCard key={streamer.seq} streamer={streamer} />
              ))}
              {pool.length === 0 && <p className={styles.emptyPool}>조건에 맞는 스트리머가 없습니다.</p>}
            </div>
          </aside>

          <section className={styles.buildPanel}>
            <div className={styles.captainRow}>
              <label className={styles.teamNameLabel}>
                팀장
                <input
                  value={captainInput}
                  onChange={(e) => setCaptainInput(e.target.value)}
                  placeholder="본인 스트리머명"
                />
              </label>
              <button type="button" className={styles.confirmButton} onClick={handleCaptainConfirm}>
                확인
              </button>
              {captain && <span className={styles.captainBadge}>팀장: {captain.streamerName}</span>}
            </div>
            {captainError && <p className={styles.errorText}>{captainError}</p>}

            <div ref={captureRef} className={styles.captureArea}>
              <p className={styles.captureTeamName}>{teamName || '팀명 미입력'}</p>
              <LineupTable lineup={lineup} resolveStreamer={resolveStreamer} editable onRemove={handleRemove} />
            </div>

            <p className={isOverScoreLimit ? styles.errorText : undefined}>
              합산 점수: {totalScore}점 / {MAX_TOTAL_SCORE}점
              {isOverScoreLimit && ` (초과로 팀 구성이 불가합니다)`}
            </p>
            {remainingLines.length > 0 && (
              <p className={styles.remainingRow}>
                남은 점수: {remainingScore}점
                <button type="button" className={styles.recommendButton} onClick={openRecommendModal}>
                  추천 스트리머
                </button>
              </p>
            )}

            <div className={styles.buildActions}>
              <button type="button" className={styles.buildButton} onClick={openResultModal}>
                팀 빌드
              </button>
              <button type="button" className={styles.captureButton} onClick={handleCapture} title="이미지로 캡처">
                📷
              </button>
            </div>
          </section>
        </div>
      </div>

      <DragOverlay>{activeStreamer && <StreamerCard streamer={activeStreamer} />}</DragOverlay>

      {mismatch && (
        <Modal onClose={() => setMismatch(null)}>
          <p className={styles.modalText}>
            <strong>{mismatch.streamer.streamerName}</strong>님은 {LINE_LABEL_KO[mismatch.line]} 라인 스트리머가
            아닙니다.
            <br />
            그래도 등록하시겠습니까?
          </p>
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalConfirm} onClick={confirmMismatch}>
              확인
            </button>
            <button type="button" className={styles.modalCancel} onClick={() => setMismatch(null)}>
              취소
            </button>
          </div>
        </Modal>
      )}

      {resultOpen && resultStep === 'name' && (
        <Modal onClose={closeResultModal}>
          <label className={styles.teamNameLabel}>
            팀명
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀명을 입력하세요"
              autoFocus
            />
          </label>
          {teamNameError && <p className={styles.errorText}>{teamNameError}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalConfirm} onClick={handleConfirmTeamName}>
              확인
            </button>
            <button type="button" className={styles.modalCancel} onClick={closeResultModal}>
              취소
            </button>
          </div>
        </Modal>
      )}

      {resultOpen && resultStep === 'result' && (
        <Modal onClose={closeResultModal}>
          <p className={styles.modalText}>
            {isOverScoreLimit
              ? `합산 점수가 ${MAX_TOTAL_SCORE}점을 초과하여 팀 구성이 불가능합니다.`
              : !canBuild
                ? '해당 팀은 구성이 불가능합니다.'
                : saved
                  ? '팀이 저장되었습니다.'
                  : '해당 팀은 구성이 가능합니다. 저장하시겠습니까?'}
          </p>
          {saveError && <p className={styles.errorText}>{saveError}</p>}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalConfirm}
              onClick={saved ? closeResultModal : handleConfirmResult}
              disabled={saving}
            >
              {saving ? '저장 중...' : '확인'}
            </button>
            <button type="button" className={styles.modalCancel} onClick={closeResultModal} disabled={saving}>
              취소
            </button>
          </div>
        </Modal>
      )}

      {recommendOpen && (
        <RecommendModal
          remainingLines={remainingLines}
          remainingScore={remainingScore}
          singleCandidates={recommendSingle}
          combos={recommendCombosResult}
          onSelectSingle={handleSelectSingleRecommendation}
          onSelectCombo={handleSelectComboRecommendation}
          onClose={closeRecommendModal}
        />
      )}
    </DndContext>
  );
}
