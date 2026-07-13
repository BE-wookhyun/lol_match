import type { Line } from '../types';
import { LINE_LABEL_KO } from '../constants/tiers';
import { LINE_IMG } from '../constants/images';
import styles from './ShortcutBar.module.css';

type ShortcutBarProps =
  | { mode: 'tier'; items: string[] }
  | { mode: 'line'; items: Line[] };

function scrollToSection(prefix: string, key: string) {
  document.getElementById(`${prefix}-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ShortcutBar(props: ShortcutBarProps) {
  const { mode, items } = props;
  const prefix = mode === 'tier' ? 'tier' : 'line';

  if (mode === 'tier') {
    return (
      <div className={styles.bar}>
        <span className={styles.label}>바로가기</span>
        <div className={styles.icons}>
          {items.map((grade) => (
            <button
              key={grade}
              type="button"
              className={styles.textButton}
              onClick={() => scrollToSection(prefix, grade)}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bar}>
      <span className={styles.label}>바로가기</span>
      <div className={styles.icons}>
        {items.map((line) => (
          <button
            key={line}
            type="button"
            className={styles.iconButton}
            title={LINE_LABEL_KO[line]}
            onClick={() => scrollToSection(prefix, line)}
          >
            <img className={styles.icon} src={LINE_IMG[line]} alt={LINE_LABEL_KO[line]} />
          </button>
        ))}
      </div>
    </div>
  );
}
