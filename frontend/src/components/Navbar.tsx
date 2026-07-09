import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { to: '/', label: '티어 데이터베이스' },
  { to: '/team-build', label: '팀 구성하기' },
  { to: '/teams', label: '구성된 팀' },
  { to: '/matches', label: '대결 기록' },
];

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo}>
          2026 LoL 멸망전 <span>with Gen.G</span>
        </NavLink>
        <nav className={styles.links}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
