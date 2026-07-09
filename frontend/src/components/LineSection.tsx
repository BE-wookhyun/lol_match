import type { Line, Streamer } from '../types';
import { LINE_LABEL_KO } from '../constants/tiers';
import { LINE_IMG } from '../constants/images';
import StreamerCard from './StreamerCard';
import styles from './TierSection.module.css';

interface LineSectionProps {
  line: Line;
  streamers: Streamer[];
  onDeleteStreamer?: (streamer: Streamer) => void;
}

export default function LineSection({ line, streamers, onDeleteStreamer }: LineSectionProps) {
  return (
    <section id={`line-${line}`} className={styles.section} data-line={line}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          <img className={styles.icon} src={LINE_IMG[line]} alt={LINE_LABEL_KO[line]} />
          {LINE_LABEL_KO[line]} ({line})
        </h2>
        <span className={styles.count}>{streamers.length}명</span>
      </header>
      <div className={styles.grid}>
        {streamers.map((streamer) => (
          <StreamerCard key={streamer.seq} streamer={streamer} onDelete={onDeleteStreamer} />
        ))}
      </div>
    </section>
  );
}
