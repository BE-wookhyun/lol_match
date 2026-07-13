import type { Streamer } from '../types';
import StreamerCard from './StreamerCard';
import styles from './TierSection.module.css';

interface TierSectionProps {
  grade: string;
  streamers: Streamer[];
  onDeleteStreamer?: (streamer: Streamer) => void;
}

export default function TierSection({ grade, streamers, onDeleteStreamer }: TierSectionProps) {
  return (
    <section id={`tier-${grade}`} className={styles.section} data-tier={grade}>
      <header className={styles.header}>
        <h2 className={styles.title}>{grade}</h2>
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
