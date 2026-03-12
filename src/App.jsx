import { useState, useCallback } from 'react'
import UploadScreen from './UploadScreen'
import Dashboard from './Dashboard'
import Heatmap from './Heatmap'
import IssueModal from './IssueModal'
import SettingsPanel from './SettingsPanel'
import { extractTextFromFile } from './fileExtractor'
import { parseManuscript, analyzeManuscript, buildStats } from './analyzer'
import { exportToCSV, exportToText, exportToPDF } from './exporter'
import styles from './App.module.css'

const DEFAULT_SETTINGS = {
  genre: 'romantasy',
  sensitivity: 3,
  strictAIMode: false,
  voiceConsistency: true,
  multiPOV: true,
  customPhrases: [],
  customBannedWords: [],
  customPhrasesText: '',
  customWordsText: '',
}

const FILTER_TYPES = [
  { id: 'all', label: 'All Issues' },
  { id: 'sentence-starters', label: 'Sentence Starters' },
  { id: 'out-of-place', label: 'Out-of-Place' },
  { id: 'micro-phrases', label: 'Micro-Phrases' },
  { id: 'dialogue', label: 'Dialogue' },
  { id: 'ai-tell', label: 'AI-Tell' },
  { id: 'pov', label: 'POV Drift' },
  { id: 'overuse', label: 'Word Overuse' },
  { id: 'cadence', label: 'Cadence' },
  { id: 'genre-voice', label: 'Genre Voice' },
]

export default function App() {
  const [screen, setScreen] = useState('upload') // 'upload' | 'analysis'
  const [uploadState, setUploadState] = useState({ loading: false, progress: 0, step: '' })

  const [manuscriptTitle, setManuscriptTitle] = useState('Untitled Manuscript')
  const [chapters, setChapters] = useState([])
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState(null)
  const [preset, setPreset] = useState('romantasy')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const [activeView, setActiveView] = useState('dashboard') // 'dashboard' | 'heatmap' | 'chapter-N'
  const [activeChapterIndex, setActiveChapterIndex] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [modalIssue, setModalIssue] = useState(null)
  const [modalIssues, setModalIssues] = useState([])
  const [modalIndex, setModalIndex] = useState(0)

  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const runAnalysis = useCallback((parsedChapters, currentSettings) => {
    const issueList = analyzeManuscript(parsedChapters, currentSettings)
    const statsObj = buildStats(parsedChapters, issueList)
    setIssues(issueList)
    setStats(statsObj)
  }, [])

  const handleFileSelected = async (file) => {
    setUploadState({ loading: true, progress: 5, step: 'Reading file…' })
    try {
      const text = await extractTextFromFile(file, (step, progress) => {
        setUploadState({ loading: true, progress, step })
      })

      setUploadState({ loading: true, progress: 70, step: 'Parsing chapters…' })
      await new Promise(r => setTimeout(r, 50))

      const parsedChapters = parseManuscript(text)
      setChapters(parsedChapters)

      const fileTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
      setManuscriptTitle(fileTitle)

      setUploadState({ loading: true, progress: 85, step: 'Running analysis…' })
      await new Promise(r => setTimeout(r, 50))

      const activeSettings = { ...settings, genre: preset }
      runAnalysis(parsedChapters, activeSettings)

      setUploadState({ loading: true, progress: 100, step: 'Done!' })
      await new Promise(r => setTimeout(r, 300))

      setScreen('analysis')
      setActiveView('dashboard')
      setUploadState({ loading: false, progress: 0, step: '' })
    } catch (err) {
      console.error(err)
      setUploadState({ loading: false, progress: 0, step: '' })
      alert(`Error reading file: ${err.message}`)
    }
  }

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings)
    if (chapters.length) runAnalysis(chapters, newSettings)
  }

  const openModal = (issue, filteredList, idx) => {
    setModalIssue(issue)
    setModalIssues(filteredList)
    setModalIndex(idx)
  }

  const closeModal = () => { setModalIssue(null); setModalIssues([]); setModalIndex(0) }

  const navigateModal = (dir) => {
    const next = modalIndex + dir
    if (next < 0 || next >= modalIssues.length) return
    setModalIssue(modalIssues[next])
    setModalIndex(next)
  }

  const chapterIssues = (chIdx) => issues.filter(i => i.chapterIndex === chIdx)

  // Export handlers
  const handleExport = (type) => {
    setShowExport(false)
    if (type === 'csv') exportToCSV(issues, `${manuscriptTitle}-quill.csv`)
    if (type === 'txt') exportToText(stats, issues, `${manuscriptTitle}-quill.txt`)
    if (type === 'pdf') exportToPDF(stats, issues, manuscriptTitle)
  }

  if (screen === 'upload') {
    return (
      <UploadScreen
        onFileSelected={handleFileSelected}
        preset={preset}
        onPresetChange={setPreset}
        uploadState={uploadState}
      />
    )
  }

  // ── Analysis Screen ──────────────────────────────────────────────────────

  const filteredIssues = issues.filter(i => activeFilter === 'all' || i.type === activeFilter)
  const chapterForView = activeChapterIndex !== null
    ? chapters.find(c => c.index === activeChapterIndex) : null

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <QuillIcon />
          <span className={styles.logoText}>Quill</span>
        </div>
        <div className={styles.titleBar}>
          <span className={styles.msTitle}>{manuscriptTitle}</span>
          <span className={styles.msMeta}>
            {stats?.totalWords.toLocaleString()} words · {stats?.totalChapters} chapters · {stats?.totalIssues} issues
          </span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.ghostBtn} onClick={() => { setScreen('upload'); setChapters([]); setIssues([]); setStats(null) }}>
            ↑ New
          </button>
          <div style={{ position: 'relative' }}>
            <button className={styles.ghostBtn} onClick={() => setShowExport(v => !v)}>Export ↓</button>
            {showExport && (
              <div className={styles.exportMenu}>
                <button onClick={() => handleExport('pdf')}>PDF Report</button>
                <button onClick={() => handleExport('csv')}>CSV Spreadsheet</button>
                <button onClick={() => handleExport('txt')}>Text Summary</button>
              </div>
            )}
          </div>
          <button className={styles.ghostBtn} onClick={() => setShowSettings(true)}>⚙ Settings</button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className={styles.sideHeading}>Overview</div>
            <button className={`${styles.sideItem} ${activeView === 'dashboard' ? styles.active : ''}`}
              onClick={() => { setActiveView('dashboard'); setActiveChapterIndex(null) }}>
              <span>◈</span> Dashboard
            </button>
            <button className={`${styles.sideItem} ${activeView === 'heatmap' ? styles.active : ''}`}
              onClick={() => { setActiveView('heatmap'); setActiveChapterIndex(null) }}>
              <span>⬛</span> Density Map
            </button>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.sideHeading}>Chapters</div>
            {chapters.map(ch => (
              <button
                key={ch.index}
                className={`${styles.chapterItem} ${activeChapterIndex === ch.index ? styles.active : ''}`}
                onClick={() => { setActiveView('chapter'); setActiveChapterIndex(ch.index) }}
              >
                <span className={styles.chName}>{ch.title}</span>
                <span className={styles.chBadge}>{chapterIssues(ch.index).length}</span>
              </button>
            ))}
          </div>

          <div className={styles.sideSection}>
            <div className={styles.sideHeading}>Filters</div>
            {FILTER_TYPES.map(f => (
              <button
                key={f.id}
                className={`${styles.filterItem} ${activeFilter === f.id ? styles.filterActive : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className={styles.main}>
          {/* Dashboard */}
          {activeView === 'dashboard' && (
            <div className={styles.viewWrap}>
              <div className={styles.viewHeader}>
                <h2>Manuscript Dashboard</h2>
                <input
                  className={styles.search}
                  type="text"
                  placeholder="Search flags…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Dashboard
                stats={stats}
                issues={filteredIssues}
                onIssueClick={openModal}
                searchQuery={searchQuery}
                activeFilter={activeFilter}
              />
            </div>
          )}

          {/* Heatmap */}
          {activeView === 'heatmap' && (
            <div className={styles.viewWrap}>
              <div className={styles.viewHeader}>
                <h2>Issue Density Map</h2>
              </div>
              <Heatmap chapters={chapters} stats={stats} />
            </div>
          )}

          {/* Chapter View */}
          {activeView === 'chapter' && chapterForView && (
            <div className={styles.viewWrap}>
              <div className={styles.viewHeader}>
                <h2>{chapterForView.title}</h2>
              </div>
              {chapterForView.pov && (
                <div className={styles.povChip}>POV: {chapterForView.pov}</div>
              )}
              <div className={styles.chapterMeta}>
                <span><strong>{chapterIssues(activeChapterIndex).length}</strong> issues</span>
                <span><strong>{chapterForView.rawText?.trim().split(/\s+/).length.toLocaleString()}</strong> words</span>
                <span><strong>{chapterForView.allSentences?.length}</strong> sentences</span>
              </div>
              <Dashboard
                stats={{ ...stats, byChapter: stats.byChapter, topPhrases: [], topStarters: [] }}
                issues={chapterIssues(activeChapterIndex)}
                onIssueClick={(issue, list, idx) => openModal(issue, list, idx)}
                searchQuery=""
                activeFilter="all"
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {modalIssue && (
        <IssueModal
          issue={modalIssue}
          issues={modalIssues}
          currentIndex={modalIndex}
          onClose={closeModal}
          onNavigate={navigateModal}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function QuillIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L16.5 9H24L18 13.5L20.5 20.5L14 16L7.5 20.5L10 13.5L4 9H11.5L14 2Z" fill="url(#qg3)" />
      <defs>
        <linearGradient id="qg3" x1="4" y1="2" x2="24" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9A84C" /><stop offset="1" stopColor="#E8C97A" />
        </linearGradient>
      </defs>
    </svg>
  )
}
