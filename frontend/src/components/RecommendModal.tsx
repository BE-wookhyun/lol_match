import { LINE_LABEL_KO, LINE_PRIORITY_ORDER } from '../constants/tiers';
import type { Line, Streamer } from '../types';
import type { StreamerCombo } from '../utils/recommend';
import Modal from './Modal';
import styles from './RecommendModal.module.css';

interface RecommendModalProps {
  remainingLines: Line[];
  remainingScore: number;
  singleCandidates: Streamer[] | null;
  combos: StreamerCombo[] | null;
  onSelectSingle: (streamer: Streamer) => void;
  onSelectCombo: (combo: StreamerCombo) => void;
  onClose: () => void;
}

export default function RecommendModal({
  remainingLines,
  remainingScore,
  singleCandidates,
  combos,
  onSelectSingle,
  onSelectCombo,
  onClose,
}: RecommendModalProps) {
  const priorityLines = LINE_PRIORITY_ORDER.filter((line) => remainingLines.includes(line));

  return (
    <Modal onClose={onClose}>
      <p className={styles.title}>추천 스트리머</p>
      <p className={styles.subtitle}>남은 점수 {remainingScore}점</p>

      {singleCandidates && (
        <ul className={styles.list}>
          {singleCandidates.length === 0 && <li className={styles.empty}>추천할 스트리머가 없습니다.</li>}
          {singleCandidates.map((streamer) => (
            <li key={streamer.seq} className={styles.row}>
              <span className={styles.lineTag}>{LINE_LABEL_KO[streamer.line]}</span>
              <span className={styles.name}>{streamer.streamerName}</span>
              <span className={styles.score}>{streamer.score ?? 0}점</span>
              <button type="button" className={styles.selectButton} onClick={() => onSelectSingle(streamer)}>
                선택
              </button>
            </li>
          ))}
        </ul>
      )}

      {combos && (
        <ul className={styles.list}>
          {combos.length === 0 && <li className={styles.empty}>추천할 조합이 없습니다.</li>}
          {combos.map((combo, i) => (
            <li key={i} className={styles.comboRow}>
              <div className={styles.comboMembers}>
                {priorityLines.map((line) => {
                  const streamer = combo.picks[line];
                  return (
                    <span key={line} className={styles.comboMember}>
                      <span className={styles.lineTag}>{LINE_LABEL_KO[line]}</span>
                      {streamer?.streamerName} ({streamer?.score ?? 0}점)
                    </span>
                  );
                })}
              </div>
              <span className={styles.comboTotal}>합산 {combo.total}점</span>
              <button type="button" className={styles.selectButton} onClick={() => onSelectCombo(combo)}>
                선택
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.closeButton} onClick={onClose}>
        닫기
      </button>
    </Modal>
  );
}
