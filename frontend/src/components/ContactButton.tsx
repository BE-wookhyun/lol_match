import styles from './ContactButton.module.css';

const CONTACT_EMAIL = 'be.wook0203@gmail.com';

export default function ContactButton() {
  return (
    <a
      className={styles.button}
      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[LoL Match] 문의')}`}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
      문의하기
    </a>
  );
}
