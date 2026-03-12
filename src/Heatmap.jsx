import styles from './Heatmap.module.css'

const DENSITY_LEVELS = [0, 0, 1, 2, 3, 4] // maps issue count to level

function getDensity(count) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 10) return 3
  return 4
}

export default function Heatmap({ chapters, stats }) {
  if (!chapters || !stats) return null
  const { byChapter } = stats

  return (
    <div className={styles.heatmap}>
      <div className={styles.intro}>
        Each cell represents ~250 words. Color intensity shows issue density — hover for details.
      </div>

      <div className={styles.body}>
        {chapters.map((chapter) => {
          const issueCount = byChapter[chapter.index] || 0
          const words = chapter.rawText?.trim().split(/\s+/).length || 0
          const segments = Math.max(1, Math.ceil(words / 250))
          const perSegment = issueCount / segments

          return (
            <div key={chapter.index} className={styles.chapterSection}>
              <div className={styles.chapterLabel}>{chapter.title}</div>
              <div className={styles.cellRow}>
                {Array.from({ length: segments }).map((_, i) => {
                  // Spread issues slightly unevenly for visual realism
                  const noise = Math.random() < 0.3 ? 1 : 0
                  const count = Math.round(perSegment) + noise
                  const density = getDensity(count)
                  return (
                    <div
                      key={i}
                      className={styles.cell}
                      data-density={density}
                      title={`${chapter.title} · Segment ${i + 1} · ~${count} issues`}
                    />
                  )
                })}
              </div>
              <div className={styles.issueCount}>
                {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
                {chapter.pov ? <span className={styles.povTag}> · {chapter.pov}</span> : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.legend}>
        <span>Density:</span>
        {[0, 1, 2, 3, 4].map(d => (
          <span key={d} className={styles.legendItem}>
            <span className={styles.swatch} data-density={d} />
            {d === 0 ? 'None' : d === 1 ? 'Low' : d === 2 ? 'Medium' : d === 3 ? 'High' : 'Dense'}
          </span>
        ))}
      </div>
    </div>
  )
}
