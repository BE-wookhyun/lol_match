import { useEffect, useState } from 'react';
import { recordVisit } from '../api/visits';
import styles from './Footer.module.css';

export default function Footer() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    recordVisit()
      .then(setCount)
      .catch(() => setCount(null));
  }, []);

  return (
    <footer className={styles.footer}>
      <span>총 방문자 수 {count === null ? '-' : count.toLocaleString()}명</span>
    </footer>
  );
}
