import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/** ריווח (מ״מ) אחרי כל מקטע לפני המקטע הבא */
const CHUNK_GAP_MM = 3

/**
 * שוליים תחתונים «בטוחים» — לא מתחילים מקטע חדש אם נשאר פחות מגובה המקטע באזור הזה;
 * אם המקטע נכנס בעמוד מלא אבל לא ב־room הנוכחי — מעבירים עמוד שלם (הימנעות מ"יתום").
 */
const BOTTOM_SAFE_MM = 14

function buildHtml2CanvasOptions() {
  return {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
  }
}

/**
 * ממקם רסטר אחד — עם שוליים תחתונים משמעותיים ודילוג עמוד כשהמקטע לא נכנס ביתום.
 */
function addChunkRaster(pdf, imgData, imgWidthMm, imgHeightMm, ctx) {
  const { margin, pageH, bottomSafeMm } = ctx
  const usableBottom = pageH - margin - bottomSafeMm
  const fullPageContentMm = usableBottom - margin

  let y = ctx.y

  if (y > usableBottom - 0.5) {
    pdf.addPage()
    y = margin
  }

  const roomNow = usableBottom - y
  if (
    y > margin + 0.5 &&
    imgHeightMm <= fullPageContentMm + 0.01 &&
    imgHeightMm > roomNow + 0.01
  ) {
    pdf.addPage()
    y = margin
  }

  let offsetMm = 0

  while (offsetMm < imgHeightMm - 0.01) {
    let room = usableBottom - y
    if (room < 1) {
      pdf.addPage()
      y = margin
      room = usableBottom - margin
      continue
    }

    pdf.addImage(imgData, 'JPEG', margin, y - offsetMm, imgWidthMm, imgHeightMm)

    const slice = Math.min(room, imgHeightMm - offsetMm)
    offsetMm += slice
    y += slice

    if (offsetMm < imgHeightMm - 0.01) {
      pdf.addPage()
      y = margin
    }
  }

  ctx.y = y + CHUNK_GAP_MM
}

/**
 * PDF מגיליון הראיון — מקטעים לפי .interview-pdf-chunk (כולל שאלה-אחר-שאלה).
 * רסטר בלבד לעברית ברורה; שוליים תחתונים + דילוג עמוד כשאין מקום למקטע שלם.
 */
export async function downloadInterviewPdf(element, fileName) {
  if (!element) {
    throw new Error('Missing element for PDF')
  }

  const marginMm = 12
  element.classList.add('pdf-capture-mode')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const contentWidthMm = pageW - marginMm * 2

  const h2cOpts = buildHtml2CanvasOptions()
  const chunks = element.querySelectorAll('.interview-pdf-chunk')
  const ctx = {
    margin: marginMm,
    pageH,
    bottomSafeMm: BOTTOM_SAFE_MM,
    y: marginMm,
  }

  try {
    if (chunks.length === 0) {
      const canvas = await html2canvas(element, h2cOpts)
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width
      addChunkRaster(pdf, imgData, contentWidthMm, imgHeightMm, ctx)
    } else {
      for (const chunk of chunks) {
        if (!(chunk instanceof HTMLElement)) continue
        const canvas = await html2canvas(chunk, h2cOpts)
        const imgData = canvas.toDataURL('image/jpeg', 0.92)
        const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width
        addChunkRaster(pdf, imgData, contentWidthMm, imgHeightMm, ctx)
      }
    }
  } finally {
    element.classList.remove('pdf-capture-mode')
  }

  pdf.save(fileName)
}

export function interviewPdfFileName(applicantName) {
  const base = (applicantName || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return `${base || 'ראיון'}.pdf`
}
