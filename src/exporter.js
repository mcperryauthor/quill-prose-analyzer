import jsPDF from 'jspdf'

export function exportToCSV(issues, filename = 'quill-report.csv') {
  const headers = ['Severity','Type','Chapter','Phrase','Passage','Explanation']
  const rows = issues.map(issue => [
    issue.severity,
    issue.label,
    issue.chapter,
    issue.phrase || '',
    (issue.passage || '').replace(/"/g, '""').slice(0, 200),
    (issue.explanation || '').replace(/"/g, '""'),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  downloadBlob(csv, filename, 'text/csv')
}

export function exportToText(stats, issues, filename = 'quill-report.txt') {
  const lines = []
  lines.push('QUILL — MANUSCRIPT PROSE ANALYSIS REPORT')
  lines.push('='.repeat(50))
  lines.push(`Total Words: ${stats.totalWords.toLocaleString()}`)
  lines.push(`Total Chapters: ${stats.totalChapters}`)
  lines.push(`Total Issues: ${stats.totalIssues}`)
  lines.push(`  High: ${stats.bySeverity.high}  Medium: ${stats.bySeverity.medium}  Low: ${stats.bySeverity.low}`)
  lines.push('')
  lines.push('TOP REPEATED PHRASES')
  lines.push('-'.repeat(30))
  stats.topPhrases.forEach(([phrase, count]) => {
    lines.push(`  "${phrase}" — ${count}×`)
  })
  lines.push('')
  lines.push('ALL FLAGGED ISSUES')
  lines.push('-'.repeat(50))
  issues.forEach((issue, i) => {
    lines.push(`\n[${i + 1}] ${issue.severity.toUpperCase()} | ${issue.label} | ${issue.chapter}`)
    lines.push(`    ${issue.passage?.slice(0, 150) || ''}`)
    lines.push(`    → ${issue.explanation?.slice(0, 200) || ''}`)
  })
  downloadBlob(lines.join('\n'), filename, 'text/plain')
}

export function exportToPDF(stats, issues, manuscriptTitle = 'Manuscript') {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const margin = 20
  const pageWidth = 210
  const usable = pageWidth - margin * 2
  let y = margin

  const addText = (text, size = 10, bold = false, color = [232, 224, 208]) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, usable)
    if (y + lines.length * (size * 0.45) > 280) {
      doc.addPage()
      y = margin
    }
    doc.text(lines, margin, y)
    y += lines.length * (size * 0.45) + 2
  }

  const rule = () => {
    doc.setDrawColor(100, 80, 50)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  // Background
  doc.setFillColor(13, 12, 15)
  doc.rect(0, 0, 210, 297, 'F')

  addText('QUILL', 24, true, [201, 168, 76])
  addText('Prose Diagnostic Report — ' + manuscriptTitle, 13, false, [232, 224, 208])
  y += 4
  rule()

  addText('MANUSCRIPT STATISTICS', 11, true, [201, 168, 76])
  addText(`Words: ${stats.totalWords.toLocaleString()}   Chapters: ${stats.totalChapters}   Total Issues: ${stats.totalIssues}`)
  addText(`High: ${stats.bySeverity.high}  Medium: ${stats.bySeverity.medium}  Low: ${stats.bySeverity.low}`)
  if (stats.povCharacters.length) addText(`POV Characters: ${stats.povCharacters.join(', ')}`)
  y += 4
  rule()

  addText('TOP REPEATED PHRASES', 11, true, [201, 168, 76])
  stats.topPhrases.slice(0, 8).forEach(([p, c]) => addText(`• "${p}" — ${c}×`, 9))
  y += 4
  rule()

  addText('FLAGGED ISSUES', 11, true, [201, 168, 76])
  issues.slice(0, 60).forEach((issue, i) => {
    const srv = issue.severity.toUpperCase()
    const clr = srv === 'HIGH' ? [194,79,79] : srv === 'MEDIUM' ? [201,135,76] : [157,111,168]
    addText(`[${i+1}] ${srv} — ${issue.label} — ${issue.chapter}`, 9, true, clr)
    if (issue.passage) addText(`"${issue.passage.slice(0, 120)}"`, 8.5, false, [176, 168, 152])
    if (issue.explanation) addText(issue.explanation.slice(0, 180), 8, false, [110, 104, 96])
    y += 2
  })

  doc.save(`quill-report-${manuscriptTitle.replace(/\s+/g,'-').toLowerCase()}.pdf`)
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
