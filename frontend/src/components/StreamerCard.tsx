import { useState } from 'react';
import type { Streamer } from '../types';
import { LINE_LABEL_KO, formatRank } from '../constants/tiers';
import personIcon from '../assets/person.png';
import styles from './StreamerCard.module.css';

interface StreamerCardProps {
  streamer: Streamer;
  draggableProps?: React.HTMLAttributes<HTMLButtonElement>;
  onDelete?: (streamer: Streamer) => void;
}

export default function StreamerCard({ streamer, draggableProps, onDelete }: StreamerCardProps) {
  const [open, setOpen] = useState(false);

  function handleDoubleClick() {
    if (!onDelete) return;
    if (window.confirm(`${streamer.streamerName}님을 삭제하시겠습니까?`)) {
      onDelete(streamer);
    }
  }

  return (
    <div className={styles.wrapper} data-line={streamer.line}>
      <button
        type="button"
        className={styles.card}
        onClick={() => setOpen((v) => !v)}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...draggableProps}
      >
        <span className={`${styles.statusDot} ${streamer.isLive ? styles.live : styles.offline}`} />
        <img
          src={streamer.streamerIconUrl || personIcon}
          alt={streamer.streamerName}
          className={styles.avatar}
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = personIcon;
          }}
        />
        <span className={styles.nameBar}>{streamer.streamerName}</span>
      </button>

      {open && (
        <div className={styles.popover} role="tooltip">
          <p className={styles.popoverName}>{streamer.streamerName}</p>
          <dl className={styles.popoverList}>
            <dt>LoL ID</dt>
            <dd>{streamer.lolId}#{streamer.lolTag}</dd>
            <dt>라인</dt>
            <dd>{LINE_LABEL_KO[streamer.line]}</dd>
            <dt>랭크</dt>
            <dd>{formatRank(streamer.tier, streamer.division, streamer.lp)}</dd>
            <dt>멸망전</dt>
            <dd>
              {streamer.peakTier ? `${streamer.peakTier} (${streamer.score ?? '-'}점)` : '미집계'}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
