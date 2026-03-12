import mammoth from 'mammoth'

export async function extractTextFromFile(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase()

  onProgress?.('Reading file…', 10)

  if (ext === 'txt') {
    const text = await file.text()
    onProgress?.('Text extracted.', 100)
    return text
  }

  if (ext === 'docx') {
    onProgress?.('Parsing .docx…', 30)
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    onProgress?.('Done.', 100)
    return result.value
  }

  if (ext === 'pdf') {
    onProgress?.('Loading PDF parser…', 15)
    // Dynamically import pdfjs-dist so Vite does not try to pre-bundle the worker
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
    // Use CDN worker — avoids Vite bundling the worker incorrectly
    GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs'

    onProgress?.('Reading PDF pages…', 25)
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.(
        `Extracting page ${i} / ${pdf.numPages}…`,
        25 + Math.round((i / pdf.numPages) * 70),
      )
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item) => item.str).join(' ') + '\n'
    }
    onProgress?.('PDF extracted.', 100)
    return text
  }

  throw new Error(`Unsupported file type: .${ext}`)
}
