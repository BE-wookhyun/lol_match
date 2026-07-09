import type { Streamer, TierName } from '../types';
import { TIER_LABEL_KO } from '../constants/tiers';
import { TIER_IMG } from '../constants/images';
import StreamerCard from './StreamerCard';
import styles from './TierSection.module.css';

interface TierSectionProps {
  tier: TierName;
  streamers: Streamer[];
  onDeleteStreamer?: (streamer: Streamer) => void;
}

export default function TierSection({ tier, streamers, onDeleteStreamer }: TierSectionProps) {
  return (
    <section id={`tier-${tier}`} className={styles.section} data-tier={tier}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {TIER_LABEL_KO[tier]} 티어
          <img className={styles.icon} src={TIER_IMG[tier]} alt={TIER_LABEL_KO[tier]} />
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
