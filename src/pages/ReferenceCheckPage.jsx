import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeroBanner from '../components/AppHeroBanner.jsx'
import ConfettiCelebration from '../components/ConfettiCelebration.jsx'
import RoleSearchInput from '../components/RoleSearchInput.jsx'
import { isValidDemoRoleId } from '../data/demoRoles.js'
import { getPositionLabel } from '../data/positions.js'
import { computeReferenceQuestionnaireScore } from '../utils/scoreReferenceQuestionnaire.js'

const referenceInterviewStructure = [
  'הצגה עצמית שלכם.',
  'להבין מהממליץ באיזה ארגון עבדו יחד, האם היה המנהל הישיר של המועמד.ת ואם לא — מה הייתה המערכת המקצועית ביניהם, כמה זמן עבדו יחד ומה היה תפקידו של הממליץ באותו מקום עבודה.',
  'לתת לממליץ רקע קצר על התפקיד שהמועמד.ת אמור.ה לבצע.',
  'לתת לממליץ לדבר בצורה חופשית על המועמד.ת: התרשמות מקצועית וכל דבר נוסף שהוא בוחר לשתף.',
  'לדבר עם הממליץ בצורה ישירה על חששות שעלו אצלכם בראיון: נקודות שהפריעו ודברים שבגינם אתם לא בטוחים לגבי התאמתו לתפקיד.',
  'לבקש מהממליץ לסכם חוזקות משמעותיות של המועמד.ת מול חולשות או נקודות לשיפור.',
  'להודות לממליץ.',
]

const referenceQuestionnaire = [
  {
    id: 'managedDuration',
    question: 'כמה זמן ניהל הממליץ את המועמד.ת?',
    options: ['עד שנה', 'שנה עד שלוש שנים', 'מעל שלוש שנים'],
  },
  {
    id: 'directManager',
    question: 'האם הממליץ היה מנהל ישיר של המועמד.ת?',
    options: ['לא היה מנהל', 'מנהל בארגון אבל לא מנהל ישיר', 'מנהל ישיר'],
  },
  {
    id: 'orgSize',
    question: 'המקום שבו עבדו יחד האם מדובר ב:',
    options: ['ארגון קטן ופרטי (עד 50 עובדים)', 'ארגון בינוני (50-500 עובדים)', 'ארגון גדול (מעל 500 עובדים)'],
  },
  {
    id: 'referenceAge',
    question: 'מה לדעתך גיל הממליץ? (הערכה)',
    options: ['עד 25', '25-35', 'מעל 35'],
  },
  {
    id: 'referenceRoleLevel',
    question: 'תפקידו של הממליץ בעת ניהול המועמד.ת?',
    options: [
      "ניהול זוטר - אחמ\"ש, רכז וכד'",
      'ניהול ביניים - מנהל מסגרת / מפקד בצבא / שירות לאומי',
      "ניהול בכיר - מנהל אגף/אזור וכד'",
    ],
  },
  {
    id: 'authenticity',
    question: 'האם התרשמתם שההמלצה הייתה אותנטית?',
    options: [
      'התרשמתי שההמלצה הייתה בעיקר לצאת ידי חובה',
      'סה"כ אותנטית, נראה כי עבדו הרבה ביחד והממליץ שיתף פעולה ונתן דוגמאות',
      'מאד אותנטית, נראה כי הממליץ התאמץ לתת המלצה טובה והשתמש בהרבה דוגמאות וסופרלטיבים',
    ],
  },
  {
    id: 'descriptionTone',
    question: 'כשהממליץ תיאר את המועמד.ת האם:',
    options: [
      'התיאור היה קר והממליץ ציין חוזקות וחולשות באותו הטון והמידה',
      'היה סה"כ טוב וחיובי אבל לא משהו מיוחד',
      "הייתה המלצה מעולה והממליץ השתמש במשפטים כמו: \"זכיתם\" / \"איזה כיף לכם\" וכד'",
    ],
  },
  {
    id: 'implicitCriticism',
    question: 'האם הרגשת שהממליץ נותן לא מעט ביקורת שלילית בין הדברים ולא במפורש?',
    options: [
      'כן, הרגשתי לא מעט ביקורת שלילית נוכחת',
      'במידה סבירה ואותנטית',
      'בכלל לא, אלא אם נשאל על תכונות פחות טובות / דברים לשיפור',
    ],
  },
  {
    id: 'impression',
    question: 'האם הממליץ עשה עליך רושם של אדם רציני ומקצועי?',
    options: ['לא עשה רושם טוב', 'עשה רושם בסדר', 'מאד התרשמתי מהממליץ'],
  },
  {
    id: 'referenceCallConcern',
    question:
      'לפי מה שנאמר בשיחת ההמלצה: האם עלה נושא מדאיג (כגון אלימות, חוסר יציבות, התנהגות קיצונית, איחורים והיעדרויות כרוניים)?',
    /** 1 = כן → ציון כללי 0; 2 = לא → ציון לפי שאר השאלות בלבד */
    options: ['כן', 'לא'],
  },
]

const scoredReferenceQuestions = referenceQuestionnaire.filter((q) => q.options.length === 3)

/** צבעי מותג לסביבת שאלות — חוזרים על עצמם לפי סדר השאלות */
const REFERENCE_QUESTION_BRAND_ACCENTS = ['#0054a6', '#e36969', '#f4b848', '#6dceb3', '#8a71dd', '#3a9b9e']

function safePdfFileName(prefix, name) {
  const base = String(name || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return `${prefix}${base ? `-${base}` : ''}.pdf`
}

function getTodayDateInputValue() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function formatDisplayDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}

function buildReferenceWhatsAppText(result) {
  const lines = [
    'תוצאות שאלון ממליץ',
    '',
    'פרטי המועמד:',
    `שם: ${result.candidateName || '—'}`,
    `תפקיד: ${result.jobTitle || '—'}`,
    `תאריך שיחת המלצה: ${formatDisplayDate(result.referenceDate)}`,
    '',
    'פרטי הממליץ:',
    `שם הממליץ: ${result.referenceName || '—'}`,
    `מקום העבודה שעבדו ביחד: ${result.sharedWorkplace || '—'}`,
    '',
    'אחוז המלצה:',
    `${result.grade0to100}%`,
  ]

  if (result.grade0to100 === 0) {
    lines.push('', 'המלצה:', 'על פי התוצאות, מומלץ לא להמשיך בתהליך הגיוס עם מועמד.ת זו.')
  }

  return lines.join('\n')
}

export default function ReferenceCheckPage() {
  const resultPdfRef = useRef(null)
  const [scoreResult, setScoreResult] = useState(null)
  const [scoreError, setScoreError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [questionnaireLocked, setQuestionnaireLocked] = useState(false)
  const [showTrustBanner, setShowTrustBanner] = useState(false)
  const [confettiBurstKey, setConfettiBurstKey] = useState(0)
  const [roleId, setRoleId] = useState('')

  function handleQuestionnaireSubmit(e) {
    e.preventDefault()
    if (questionnaireLocked) return

    setScoreError(null)
    setScoreResult(null)
    setPdfError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const candidateName = String(fd.get('candidateName') ?? '').trim()
    const referenceDate = String(fd.get('referenceDate') ?? '').trim()

    const scoredValues = scoredReferenceQuestions.map((q) => fd.get(q.id))
    const concernValue = fd.get('referenceCallConcern')

    if (!candidateName) {
      setScoreError('נא למלא את שם המועמד.ת.')
      return
    }
    if (!isValidDemoRoleId(roleId)) {
      setScoreError('נא לבחור תפקיד.')
      return
    }
    if (!referenceDate) {
      setScoreError('נא לבחור תאריך שיחת המלצה.')
      return
    }

    const missingScored = scoredReferenceQuestions.some((q, i) => !scoredValues[i])
    if (missingScored || !concernValue) {
      setScoreError('נא לענות על כל השאלות לפני חישוב הציון.')
      return
    }

    const {
      raw,
      grade0to100: computedGrade,
      questionCount,
    } = computeReferenceQuestionnaireScore(scoredValues.map(String))

    if (Number.isNaN(computedGrade)) {
      setScoreError('לא ניתן לחשב ציון. נסו שוב.')
      return
    }

    /** כן = ערך 1 → ציון 0; לא = 2 → לפי שאלון */
    const grade0to100 = concernValue === '1' ? 0 : computedGrade

    const referenceName = String(fd.get('referenceName') ?? '').trim()
    const sharedWorkplace = String(fd.get('sharedWorkplace') ?? '').trim()

    setScoreResult({
      grade0to100,
      raw,
      maxRaw: questionCount * 5,
      candidateName,
      jobTitle: getPositionLabel(roleId),
      referenceDate,
      referenceName,
      sharedWorkplace,
    })
    setQuestionnaireLocked(true)
    setShowTrustBanner(true)
    if (grade0to100 >= 80) {
      setConfettiBurstKey((k) => k + 1)
    }
  }

  function handleCloseTrustBanner() {
    setShowTrustBanner(false)
  }

  function handleShareWhatsApp() {
    if (!scoreResult) return
    const text = buildReferenceWhatsAppText(scoreResult)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  async function handleDownloadResultPdf() {
    const el = resultPdfRef.current
    if (!el || !scoreResult || pdfLoading) return

    setPdfError(null)
    setPdfLoading(true)
    try {
      const { downloadInterviewPdf } = await import('../utils/downloadInterviewPdf.js')
      await downloadInterviewPdf(el, safePdfFileName('שאלון-ממליץ', scoreResult.candidateName))
    } catch {
      setPdfError('לא ניתן לייצר PDF כרגע. נסו שוב.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="reference-page" dir="rtl">
      <AppHeroBanner />

      <header className="prep-header no-print">
        <Link to="/" className="prep-back">
          ← חזרה לדף הבית
        </Link>
        <h1 className="prep-title">שאלון ממליץ</h1>
        <p className="prep-lead">
          מבנה מומלץ לשיחות המלצה טלפוניות
        </p>
      </header>

      <section className="card reference-section no-print" aria-labelledby="reference-structure-heading">
        <h2 id="reference-structure-heading" className="sheet-section-title sheet-section-title-primary">
          מבנה ההמלצה הטלפונית
        </h2>
        <ol className="reference-structure-list" start={1}>
          {referenceInterviewStructure.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="card reference-section no-print" aria-labelledby="reference-questionnaire-heading">
        <h2 id="reference-questionnaire-heading" className="sheet-section-title">
          שאלון ממליץ
        </h2>
        <form
          className={`reference-questionnaire-form${questionnaireLocked ? ' reference-questionnaire-form--locked' : ''}`}
          onSubmit={handleQuestionnaireSubmit}
        >
          <h3 className="sheet-section-title sheet-section-title-primary">פרטי מועמד.ת</h3>
          <div className="reference-text-fields">
            <label className="form-label">
              שם המועמד.ת:
              <input
                className="form-input"
                name="candidateName"
                type="text"
                autoComplete="name"
                disabled={questionnaireLocked}
                required
              />
            </label>
            <label className="form-label">
              תאריך שיחת המלצה:
              <input
                className="form-input"
                name="referenceDate"
                type="date"
                defaultValue={getTodayDateInputValue()}
                disabled={questionnaireLocked}
                required
              />
            </label>
            <label className="form-label">
              תפקיד באלוט:
              <RoleSearchInput
                name="role"
                value={roleId}
                onChange={setRoleId}
                required
                disabled={questionnaireLocked}
              />
            </label>
          </div>

          <h3 className="sheet-section-title sheet-section-title-primary">פרטי הממליץ</h3>
          <div className="reference-text-fields">
            <label className="form-label">
              שם הממליץ:
              <input
                className="form-input"
                name="referenceName"
                type="text"
                autoComplete="off"
                disabled={questionnaireLocked}
              />
            </label>
            <label className="form-label">
              מקום העבודה שעבדו ביחד:
              <input
                className="form-input"
                name="sharedWorkplace"
                type="text"
                autoComplete="off"
                disabled={questionnaireLocked}
              />
            </label>
          </div>

          {referenceQuestionnaire.map((item, qIndex) => (
            <section
              key={item.id}
              className="reference-question-block"
              aria-labelledby={`ref-q-${item.id}`}
              style={{
                '--reference-q-accent':
                  REFERENCE_QUESTION_BRAND_ACCENTS[qIndex % REFERENCE_QUESTION_BRAND_ACCENTS.length],
              }}
            >
              <h3 id={`ref-q-${item.id}`} className="reference-question-title">
                {item.question}
              </h3>
              <div
                className={`reference-options-grid${item.options.length === 2 ? ' reference-options-grid--two' : ''}`}
              >
                {item.options.map((option, i) => (
                  <label key={option} className="reference-option-card">
                    <input
                      type="radio"
                      name={item.id}
                      value={String(i + 1)}
                      className="reference-option-input"
                      disabled={questionnaireLocked}
                    />
                    <span className="reference-option-text">{option}</span>
                    <span className="reference-option-index">{i + 1}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}

          {scoreError ? <p className="reference-score-error">{scoreError}</p> : null}

          <div className="reference-form-actions">
            <button type="submit" className="btn btn-primary" disabled={questionnaireLocked}>
              חשב ציון לממליץ
            </button>
          </div>
        </form>
      </section>

      {questionnaireLocked && showTrustBanner && scoreResult ? (
        <>
          {scoreResult.grade0to100 >= 80 ? (
            <ConfettiCelebration burstKey={confettiBurstKey} />
          ) : null}
          <div className="reference-trust-backdrop" aria-hidden />
          <div
            className="reference-trust-banner"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reference-trust-dialog-title"
            aria-live="polite"
          >
            <button
              type="button"
              className="reference-trust-banner-close"
              onClick={handleCloseTrustBanner}
              aria-label="סגור"
            >
              ×
            </button>
            <div ref={resultPdfRef} className="reference-trust-pdf-root" dir="rtl">
              <p className="reference-trust-pdf-kicker">תוצאות שאלון ממליץ</p>
              <div className="reference-trust-result-meta">
                <div className="reference-trust-result-row">
                  <span className="reference-trust-result-label">שם המועמד.ת</span>
                  <span className="reference-trust-result-value">
                    {scoreResult.candidateName || '—'}
                  </span>
                </div>
                <div className="reference-trust-result-row">
                  <span className="reference-trust-result-label">תפקיד</span>
                  <span className="reference-trust-result-value">
                    {scoreResult.jobTitle || '—'}
                  </span>
                </div>
                <div className="reference-trust-result-row">
                  <span className="reference-trust-result-label">תאריך שיחת המלצה</span>
                  <span className="reference-trust-result-value">
                    {formatDisplayDate(scoreResult.referenceDate)}
                  </span>
                </div>
                <div className="reference-trust-result-row">
                  <span className="reference-trust-result-label">שם הממליץ</span>
                  <span className="reference-trust-result-value">
                    {scoreResult.referenceName || '—'}
                  </span>
                </div>
                <div className="reference-trust-result-row">
                  <span className="reference-trust-result-label">מקום העבודה שעבדו ביחד</span>
                  <span className="reference-trust-result-value">
                    {scoreResult.sharedWorkplace || '—'}
                  </span>
                </div>
              </div>
              <p id="reference-trust-dialog-title" className="reference-trust-result-gradient">
                אחוז המלצה {scoreResult.grade0to100}%
              </p>
              {scoreResult.grade0to100 === 0 ? (
                <p className="reference-trust-zero-advisory">
                  על פי התוצאות, מומלץ לא להמשיך בתהליך הגיוס עם מועמד.ת זו.
                </p>
              ) : null}
            </div>
            <div className="rating-result-share-actions">
              {pdfError ? <p className="pdf-error-hint">{pdfError}</p> : null}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadResultPdf}
                disabled={pdfLoading}
              >
                {pdfLoading ? 'מייצר PDF…' : 'הורד כ־PDF'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleShareWhatsApp}>
                שליחה ב־WhatsApp
              </button>
            </div>
          </div>
        </>
      ) : null}

      {questionnaireLocked ? (
        <div className="page-bottom-home-actions no-print">
          <Link to="/" className="btn btn-secondary">
            חזרה לדף הבית
          </Link>
        </div>
      ) : null}
    </div>
  )
}
