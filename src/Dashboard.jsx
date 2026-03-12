import styles from './Dashboard.module.css'

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, note: 3 }
const TYPE_LABELS = {
  'sentence-starters': 'Sentence Starters',
  'out-of-place': 'Out-of-Place Prose',
  'micro-phrases': 'Micro-Phrases',
  'dialogue': 'Dialogue',
  'ai-tell': 'AI-Tell',
  'pov': 'POV Drift',
  'overuse': 'Word Overuse',
  'cadence': 'Cadence',
  'genre-voice': 'Genre Voice',
  'ai-pattern': 'AI Pattern',
}

export default function Dashboard({ stats, issues, onIssueClick, searchQuery, activeFilter }) {
  if (!stats || !issues) return null

  const filtered = issues.filter(issue => {
    if (activeFilter !== 'all' && issue.type !== activeFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        issue.passage?.toLowerCase().includes(q) ||
        issue.label?.toLowerCase().includes(q) ||
        issue.phrase?.toLowerCase().includes(q) ||
        issue.chapter?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className={styles.dashboard}>
      {/* Summary Cards */}
      <div className={styles.cards}>
        <StatCard value={stats.totalWords.toLocaleString()} label="Total Words" accent="#C9A84C" />
        <StatCard value={stats.totalChapters} label="Chapters" accent="#9D6FA8" />
        <StatCard value={stats.totalIssues} label="Total Issues" accent="#c9874c" />
        <StatCard value={stats.bySeverity.high} label="High Priority" accent="#c24f4f" />
        <StatCard value={stats.bySeverity.medium} label="Medium" accent="#c9874c" />
        <StatCard value={stats.bySeverity.low} label="Low / Stylistic" accent="#4f7ec2" />
      </div>

      {/* Top Patterns */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Top Flagged Patterns</h3>
        <div className={styles.topGrid}>
          <TopCard title="Most Repeated Phrases" items={stats.topPhrases.slice(0,8)} />
          <TopCard title="Top Sentence Starters" items={stats.topStarters.slice(0,8)} />
          <IssueTypeBreakdown byType={stats.byType} />
        </div>
      </div>

      {/* Issue Table */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Flagged Passages
          <span className={styles.badge}>{filtered.length}</span>
        </h3>
        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <span>Severity</span>
            <span>Type</span>
            <span>Passage</span>
            <span>Chapter</span>
            <span></span>
          </div>
          <div className={styles.tableBody}>
            {filtered.length === 0 && (
              <div className={styles.empty}>No issues match the current filter.</div>
            )}
            {filtered.map((issue, i) => (
              <IssueRow key={i} issue={issue} onClick={() => onIssueClick(issue, filtered, i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, accent }) {
  return (
    <div className={styles.statCard} style={{ '--accent': accent }}>
      <div className={styles.statValue} style={{ color: accent }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function TopCard({ title, items }) {
  return (
    <div className={styles.topCard}>
      <div className={styles.topCardTitle}>{title}</div>
      {items.length === 0 && <p className={styles.empty}>None detected</p>}
      {items.map(([phrase, count], i) => (
        <div key={i} className={styles.phraseRow}>
          <span className={styles.phraseText}>"{phrase}"</span>
          <span className={styles.phraseCount}>{count}×</span>
        </div>
      ))}
    </div>
  )
}

function IssueTypeBreakdown({ byType }) {
  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1
  return (
    <div className={styles.topCard}>
      <div className={styles.topCardTitle}>Issues by Type</div>
      {entries.map(([type, count]) => (
        <div key={type} className={styles.typeRow}>
          <span className={styles.typeLabel}>{TYPE_LABELS[type] || type}</span>
          <div className={styles.typeBar}>
            <div className={styles.typeBarFill} style={{ width: `${Math.round(count / total * 100)}%` }} />
          </div>
          <span className={styles.typeCount}>{count}</span>
        </div>
      ))}
    </div>
  )
}

function IssueRow({ issue, onClick }) {
  const sev = issue.severity
  const sevClass = sev === 'high' ? styles.high : sev === 'medium' ? styles.medium : sev === 'low' ? styles.low : styles.note
  return (
    <div className={styles.issueRow} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <span className={`${styles.pill} ${sevClass}`}>{sev}</span>
      <span className={styles.issueType}>{TYPE_LABELS[issue.type] || issue.type}</span>
      <span className={styles.issuePassage}>{issue.passage?.slice(0, 90) || issue.phrase || '—'}</span>
      <span className={styles.issueChapter}>{issue.chapter}</span>
      <button className={styles.expandBtn} aria-label="View details" onClick={e => { e.stopPropagation(); onClick() }}>→</button>
    </div>
  )
}
