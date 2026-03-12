import { useState } from 'react'
import styles from './SettingsPanel.module.css'

const GENRES = [
  { id: 'romantasy', label: 'Dark Fantasy / Romantasy' },
  { id: 'fantasy', label: 'Epic Fantasy' },
  { id: 'fiction', label: 'Literary Fiction' },
  { id: 'custom', label: 'Custom' },
]

export default function SettingsPanel({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const update = (key, val) => setLocal(prev => ({ ...prev, [key]: val }))

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>Analysis Settings</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <label className={styles.label}>Genre Profile</label>
            <select
              className={styles.select}
              value={local.genre}
              onChange={e => update('genre', e.target.value)}
            >
              {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Analysis Mode</label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={local.strictAIMode}
                onChange={e => update('strictAIMode', e.target.checked)} />
              Strict AI-Tell Scan
              <span className={styles.toggleNote}>(flags even single occurrences)</span>
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={local.voiceConsistency}
                onChange={e => update('voiceConsistency', e.target.checked)} />
              Voice Consistency Mode
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={local.multiPOV}
                onChange={e => update('multiPOV', e.target.checked)} />
              Multi-POV Detection
            </label>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Sensitivity</label>
            <div className={styles.sliderRow}>
              <span>Lenient</span>
              <input type="range" min={1} max={5} className={styles.slider}
                value={local.sensitivity}
                onChange={e => update('sensitivity', Number(e.target.value))} />
              <span>Strict</span>
              <strong className={styles.sliderVal}>{local.sensitivity}</strong>
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Custom Phrase Watchlist</label>
            <textarea
              className={styles.textarea}
              placeholder={"Enter phrases to watch for, one per line\ne.g. his jaw tightened\nsomething in my chest"}
              value={local.customPhrasesText || ''}
              onChange={e => update('customPhrasesText', e.target.value)}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Custom Word Watchlist</label>
            <textarea
              className={styles.textarea}
              placeholder={"Words to track overuse of, one per line\ne.g. fracture\nsurge\nhunger"}
              value={local.customWordsText || ''}
              onChange={e => update('customWordsText', e.target.value)}
            />
          </div>

          <button className={styles.saveBtn} onClick={() => {
            onSave({
              ...local,
              customPhrases: (local.customPhrasesText || '').split('\n').map(s => s.trim()).filter(Boolean),
              customBannedWords: (local.customWordsText || '').split('\n').map(s => s.trim()).filter(Boolean),
            })
            onClose()
          }}>
            Save &amp; Re-Run Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
