import type { Line, TierName } from '../types';
import { TIER_LABEL_KO, LINE_LABEL_KO } from '../constants/tiers';
import { TIER_IMG, LINE_IMG } from '../constants/images';
import styles from './ShortcutBar.module.css';

type ShortcutBarProps =
  | { mode: 'tier'; items: TierName[] }
  | { mode: 'line'; items: Line[] };

function scrollToSection(prefix: string, key: string) {
  document.getElementById(`${prefix}-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ShortcutBar(props: ShortcutBarProps) {
  const { mode, items } = props;
  const prefix = mode === 'tier' ? 'tier' : 'line';

  return (
    <div className={styles.bar}>
      <span className={styles.label}>바로가기</span>
      <div className={styles.icons}>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={styles.iconButton}
            title={mode === 'tier' ? TIER_LABEL_KO[item as TierName] : LINE_LABEL_KO[item as Line]}
            onClick={() => scrollToSection(prefix, item)}
          >
            <img
              className={styles.icon}
              src={mode === 'tier' ? TIER_IMG[item as TierName] : LINE_IMG[item as Line]}
              alt={mode === 'tier' ? TIER_LABEL_KO[item as TierName] : LINE_LABEL_KO[item as Line]}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
