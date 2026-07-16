import { useDroppable } from '@dnd-kit/core';
import type { Line, Streamer, TeamLineup } from '../types';
import { LINE_ORDER, LINE_LABEL_KO } from '../constants/tiers';
import styles from './LineupTable.module.css';

interface LineupTableProps {
  lineup: TeamLineup;
  resolveStreamer: (seq: number | undefined) => Streamer | undefined;
  editable?: boolean;
  onRemove?: (line: Line) => void;
  compact?: boolean;
}

function SlotRow({
  line,
  streamer,
  editable,
  onRemove,
}: {
  line: Line;
  streamer: Streamer | undefined;
  editable?: boolean;
  onRemove?: (line: Line) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${line}`, data: { line }, disabled: !editable });

  return (
    <div
      ref={editable ? setNodeRef : undefined}
      className={`${styles.row} ${isOver ? styles.over : ''}`}
      data-line={line}
    >
      <span className={styles.lineTag}>{line}</span>
      {streamer ? (
        <>
          <span className={styles.name}>{streamer.streamerName}</span>
          <span className={styles.lolId}>{streamer.lolId}#{streamer.lolTag}</span>
          <span className={styles.tier}>{streamer.score !== undefined ? `${streamer.score}점` : '-'}</span>
          {editable && onRemove && (
            <button type="button" className={styles.removeButton} onClick={() => onRemove(line)}>
              ✕
            </button>
          )}
        </>
      ) : (
        <span className={styles.placeholder}>
          {editable ? `${LINE_LABEL_KO[line]} 스트리머를 드래그하여 놓으세요` : '-'}
        </span>
      )}
    </div>
  );
}

export default function LineupTable({ lineup, resolveStreamer, editable, onRemove, compact }: LineupTableProps) {
  return (
    <div className={`${styles.table} ${compact ? styles.compact : ''}`}>
      {LINE_ORDER.map((line) => (
        <SlotRow
          key={line}
          line={line}
          streamer={resolveStreamer(lineup[line])}
          editable={editable}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
