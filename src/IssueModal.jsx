import { useEffect } from 'react'
import styles from './IssueModal.module.css'

const TYPE_LABELS = {
  'sentence-starters': 'Sentence Starters',
  'out-of-place': 'Out-of-Place Prose',
  'micro-phrases': 'Micro-Phrase',
  'dialogue': 'Dialogue',
  'ai-tell': 'AI-Tell Pattern',
  'pov': 'POV Drift',
  'overuse': 'Word Overuse',
  'cadence': 'Flow & Cadence',
  'genre-voice': 'Genre Voice',
}

export default function IssueModal({ issue, issues, currentIndex, onClose, onNavigate }) {
  if (!issue) return null

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate(1)
      if (e.key === 'ArrowLeft') onNavigate(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNavigate])

  const sevClass = issue.severity === 'high' ? styles.high
    : issue.severity === 'medium' ? styles.medium
    : issue.severity === 'low' ? styles.low : styles.note

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.header}>
          <span className={`${styles.pill} ${sevClass}`}>{issue.severity}</span>
          <span className={styles.typeTag}>{TYPE_LABELS[issue.type] || issue.type}</span>
          <span className={styles.chapterTag}>{issue.chapter}</span>
        </div>

        <h3 className={styles.title}>{issue.label}</h3>

        {issue.context && (
          <div className={styles.contextBlock}>
            <div className={styles.contextLabel}>Context</div>
            <p>{issue.context}</p>
          </div>
        )}

        {issue.passage && (
          <div className={styles.flaggedLine}>
            <span className={styles.flaggedLabel}>Flagged</span>
            {issue.passage}
          </div>
        )}

        {issue.count && (
          <div className={styles.countChip}>
            Appears <strong>{issue.count}</strong> {issue.count === 1 ? 'time' : 'times'} in this chapter
          </div>
        )}

        <div className={styles.explanation}>
          {issue.explanation}
        </div>

        {issue.alternatives?.length > 0 && (
          <div className={styles.alts}>
            <div className={styles.altsLabel}>Suggested Approaches</div>
            {issue.alternatives.map((alt, i) => (
              <div key={i} className={styles.altItem}>{alt}</div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.navBtn} onClick={() => onNavigate(-1)} disabled={currentIndex === 0}>
            ← Prev
          </button>
          <span className={styles.position}>{currentIndex + 1} / {issues.length}</span>
          <button className={styles.navBtn} onClick={() => onNavigate(1)} disabled={currentIndex === issues.length - 1}>
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
