import { useState } from 'react';
import Modal from './Modal';
import styles from './AdminKeyModal.module.css';

interface AdminKeyModalProps {
  message: string;
  onConfirm: (adminKey: string) => Promise<void>;
  onClose: () => void;
}

export default function AdminKeyModal({ message, onConfirm, onClose }: AdminKeyModalProps) {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!adminKey.trim()) {
      setError('관리자 키를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(adminKey.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <p className={styles.message}>{message}</p>
      <label className={styles.label}>
        관리자 키
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          autoFocus
          placeholder="관리자 키를 입력하세요"
        />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.confirm} onClick={handleSubmit} disabled={submitting}>
          {submitting ? '삭제 중...' : '삭제'}
        </button>
        <button type="button" className={styles.cancel} onClick={onClose} disabled={submitting}>
          취소
        </button>
      </div>
    </Modal>
  );
}
