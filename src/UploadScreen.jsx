import styles from './UploadScreen.module.css'

const PRESETS = [
  { id: 'romantasy', label: 'Dark Fantasy / Romantasy' },
  { id: 'fantasy',   label: 'Epic Fantasy' },
  { id: 'fiction',   label: 'Literary Fiction' },
  { id: 'custom',    label: 'Custom' },
]

export default function UploadScreen({ onFileSelected, preset, onPresetChange, uploadState }) {
  const { loading, progress, step } = uploadState

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add(styles.dragOver)
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles.dragOver)
  }

  const handleClick = () => {
    if (!loading) document.getElementById('quill-file-input').click()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick()
  }

  return (
    <div className={styles.screen}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <header className={styles.header}>
        <div className={styles.logo}>
          <QuillIcon />
          <span className={styles.logoText}>Quill</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.tagline}>
          <h1>Prose Diagnostic<br /><em>for the Discerning Author</em></h1>
          <p>
            Upload your manuscript for a deep, fiction-first analysis — repetition,
            POV drift, AI-tell patterns, dialogue, and rhythm issues — without flattening your voice.
          </p>
        </div>

        {!loading ? (
          <>
            <div
              className={styles.uploadZone}
              role="button"
              tabIndex={0}
              aria-label="Upload manuscript file"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              onKeyDown={handleKey}
            >
              <div className={styles.uploadInner}>
                <UploadIcon />
                <p className={styles.uploadLabel}>Drag your manuscript here</p>
                <p className={styles.uploadSub}>or click to browse</p>
                <span className={styles.formats}>.docx · .pdf · .txt</span>
              </div>
              <input
                type="file"
                id="quill-file-input"
                accept=".docx,.pdf,.txt"
                className="visually-hidden"
                onChange={(e) => { if (e.target.files[0]) onFileSelected(e.target.files[0]) }}
              />
            </div>

            <div className={styles.presets}>
              <span className={styles.presetLabel}>Genre preset:</span>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className={`${styles.presetBtn} ${preset === p.id ? styles.active : ''}`}
                  onClick={() => onPresetChange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.progressCard}>
            <p className={styles.progressLabel}>Analyzing manuscript…</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressStep}>{step}</p>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        All processing happens in your browser. Your manuscript never leaves your device.
      </footer>
    </div>
  )
}

function QuillIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L16.5 9H24L18 13.5L20.5 20.5L14 16L7.5 20.5L10 13.5L4 9H11.5L14 2Z"
        fill="url(#qg)" />
      <defs>
        <linearGradient id="qg" x1="4" y1="2" x2="24" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9A84C" /><stop offset="1" stopColor="#E8C97A" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 6L24 32M24 6L16 14M24 6L32 14" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 36V40C8 41.1 8.9 42 10 42H38C39.1 42 40 41.1 40 40V36" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
