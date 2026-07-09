import styles from './ViewToggle.module.css';

interface ViewToggleProps {
  value: 'tier' | 'line';
  onChange: (value: 'tier' | 'line') => void;
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  const isLine = value === 'line';
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        role="switch"
        aria-checked={isLine}
        className={`${styles.switch} ${isLine ? styles.on : ''}`}
        onClick={() => onChange(isLine ? 'tier' : 'line')}
      >
        <span className={styles.knob} />
      </button>
      <span className={styles.text}>{isLine ? '라인별' : '티어별'}</span>
    </div>
  );
}
