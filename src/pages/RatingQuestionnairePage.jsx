import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeroBanner from '../components/AppHeroBanner.jsx'
import ConfettiCelebration from '../components/ConfettiCelebration.jsx'
import RoleSearchInput from '../components/RoleSearchInput.jsx'
import { isValidDemoRoleId } from '../data/demoRoles.js'
import { getPositionLabel, getPositionTrack } from '../data/positions.js'
import { anchorKeys, anchorLabelByKey, anchorLegendSubtextByKey } from '../data/questionBank.js'
import {
  computeRatingQuestionnaireFinal,
  RATING_PROFILE_ENTRY,
  RATING_PROFILE_PROFESSIONAL,
  ratingProfileLabel,
} from '../utils/ratingQuestionnaireWeights.js'

const SCALE_DESC = '1 — הנמוך ביותר · 5 — הגבוה ביותר'

const ACCENTS = ['#0054a6', '#e36969', '#f4b848', '#6dceb3', '#8a71dd', '#3a9b9e']
const PREDICTION_ACCENT = '#64748b'

function emptyAnchorScores() {
  return Object.fromEntries(anchorKeys.map((k) => [k, null]))
}

function RatingScale({ value, onChange, disabled, name }) {
  const levels = [5, 4, 3, 2, 1]
  return (
    <div className="rating-scale" role="radiogroup" aria-label={name}>
      {levels.map((n) => (
        <button
          key={n}
          type="button"
          className={`rating-scale-btn${value === n ? ' rating-scale-btn--active' : ''}`}
          onClick={() => onChange(n)}
          disabled={disabled}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function ratingProfileForRoleId(roleId) {
  if (!isValidDemoRoleId(roleId)) return RATING_PROFILE_ENTRY
  return getPositionTrack(roleId) === 'entry' ? RATING_PROFILE_ENTRY : RATING_PROFILE_PROFESSIONAL
}

function summarizeAnchorScores(scores, predictionScore) {
  const summary = {
    strengths: [],
    weaknesses: [],
    neutral: [],
  }

  const items = [
    ...anchorKeys.map((key) => ({ label: anchorLabelByKey[key], score: scores[key] })),
    { label: 'ניבוי המראיין', score: predictionScore },
  ]

  for (const { label, score: rawScore } of items) {
    const score = Number(rawScore)
    const item = `${label} (${score}/5)`
    if (score >= 4) {
      summary.strengths.push(item)
    } else if (score <= 2) {
      summary.weaknesses.push(item)
    } else {
      summary.neutral.push(item)
    }
  }

  return summary
}

function formatWhatsAppList(items, emptyText) {
  if (items.length === 0) return `- ${emptyText}`
  return items.map((item) => `- ${item}`).join('\n')
}

function buildWhatsAppResultText(result, anchorSummary) {
  const baseLines = [
    'סיכום וציון ההצלחה',
    '',
    'פרטי המועמד:',
    `שם: ${result.applicantName}`,
    `טלפון: ${result.phone}`,
    `תפקיד: ${result.jobTitle}`,
    `אחוז המלצה: ${result.recommendationPercent}%`,
    '',
    'ציון ההצלחה:',
    `${result.final0to100}%`,
  ]

  if (result.final0to100 === 0) {
    return [
      ...baseLines,
      '',
      'המלצה:',
      'על פי התוצאות, מומלץ לא להמשיך בתהליך הגיוס עם מועמד.ת זו.',
    ].join('\n')
  }

  const summary = anchorSummary ?? { strengths: [], weaknesses: [], neutral: [] }
  const lines = [
    ...baseLines,
    '',
    'סיכום חוזקות מול חולשות:',
    'חוזקות:',
    formatWhatsAppList(summary.strengths, 'לא זוהו עוגנים בציון גבוה.'),
    '',
    'חולשות / נקודות לחיזוק:',
    formatWhatsAppList(summary.weaknesses, 'לא זוהו עוגנים בציון נמוך.'),
  ]

  if (summary.neutral.length > 0) {
    lines.push('', 'אזור ביניים לבדיקה:', formatWhatsAppList(summary.neutral, ''))
  }

  return lines.join('\n')
}

function safePdfFileName(prefix, name) {
  const base = String(name || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return `${prefix}${base ? `-${base}` : ''}.pdf`
}

export default function RatingQuestionnairePage() {
  const resultPdfRef = useRef(null)
  const [applicantName, setApplicantName] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState('')
  const [anchorScores, setAnchorScores] = useState(emptyAnchorScores)
  const [experienceScore, setExperienceScore] = useState(null)
  const [predictionScore, setPredictionScore] = useState(null)
  const [predictionPercent, setPredictionPercent] = useState('')
  const [formError, setFormError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [locked, setLocked] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [confettiBurstKey, setConfettiBurstKey] = useState(0)

  const profile = useMemo(() => ratingProfileForRoleId(roleId), [roleId])
  const resultAnchorSummary = useMemo(
    () =>
      result?.anchorScores
        ? summarizeAnchorScores(result.anchorScores, result.predictionScore)
        : null,
    [result],
  )

  function handleRoleChange(id) {
    setRoleId(id)
    if (ratingProfileForRoleId(id) === RATING_PROFILE_ENTRY) setExperienceScore(null)
  }

  function setAnchor(key, v) {
    setAnchorScores((prev) => ({ ...prev, [key]: v }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (locked) return
    setFormError(null)
    setResult(null)
    setPdfError(null)

    if (!applicantName.trim()) {
      setFormError('נא למלא את שם המועמד.ת.')
      return
    }
    if (!phone.trim()) {
      setFormError('נא למלא את מספר הטלפון.')
      return
    }
    if (!isValidDemoRoleId(roleId)) {
      setFormError('נא לבחור תפקיד.')
      return
    }
    if (anchorKeys.some((k) => anchorScores[k] == null)) {
      setFormError('נא לדרג את כל עוגני ההערכה (1–5).')
      return
    }
    if (profile === RATING_PROFILE_PROFESSIONAL && experienceScore == null) {
      setFormError('נא לדרג את ניסיון רלוונטי (+3 שנים).')
      return
    }
    if (predictionScore == null) {
      setFormError('נא לדרג את ניבוי המראיין (1–5).')
      return
    }

    const predRaw = String(predictionPercent).trim()
    if (predRaw === '') {
      setFormError('נא להזין את אחוז ההמלצה.')
      return
    }
    const pred = Number(predRaw)
    if (!Number.isFinite(pred) || pred < 0 || pred > 100) {
      setFormError('אחוז המלצה חייב להיות מספר בין 0 ל־100.')
      return
    }

    const out = computeRatingQuestionnaireFinal({
      profile,
      anchorScores,
      predictionScore,
      predictionPercent: pred,
      experienceScore: profile === RATING_PROFILE_PROFESSIONAL ? experienceScore : null,
    })

    if (Number.isNaN(out.final0to100)) {
      setFormError('לא ניתן לחשב ציון. בדקו את הערכים.')
      return
    }

    setResult({
      ...out,
      applicantName: applicantName.trim(),
      phone: phone.trim(),
      jobTitle: getPositionLabel(roleId),
      profile,
      profileLabel: ratingProfileLabel[profile],
      anchorScores: { ...anchorScores },
      predictionScore,
      recommendationPercent: pred,
    })
    setLocked(true)
    setShowResult(true)
    if (out.final0to100 >= 80) {
      setConfettiBurstKey((k) => k + 1)
    }
  }

  function handleCloseResult() {
    setShowResult(false)
  }

  function handleShareWhatsApp() {
    if (!result) return
    const text = buildWhatsAppResultText(result, resultAnchorSummary)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  async function handleDownloadResultPdf() {
    const el = resultPdfRef.current
    if (!el || !result || pdfLoading) return

    setPdfError(null)
    setPdfLoading(true)
    try {
      const { downloadInterviewPdf } = await import('../utils/downloadInterviewPdf.js')
      await downloadInterviewPdf(el, safePdfFileName('שאלון-דירוג', result.applicantName))
    } catch {
      setPdfError('לא ניתן לייצר PDF כרגע. נסו שוב.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="rating-page" dir="rtl">
      <AppHeroBanner />

      <header className="prep-header no-print">
        <Link to="/" className="prep-back">
          ← חזרה לדף הבית
        </Link>
        <h1 className="prep-title">שאלון הדירוג</h1>
        <p className="rating-page-header-scale">{SCALE_DESC}</p>
        <p className="prep-lead">
          דרגו כל עוגן לפי שיחת הראיון והמלצות. סוג המשקלים נקבע אוטומטית לפי התפקיד שנבחר.
        </p>
      </header>

      <form className="card rating-form no-print" onSubmit={handleSubmit}>
        <section className="rating-form-section rating-form-section--applicant">
          <h2 className="sheet-section-title sheet-section-title-primary">פרטי מועמד.ת</h2>
          <label className="form-label">
            שם המועמד.ת
            <input
              className="form-input"
              name="applicantName"
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              autoComplete="name"
              disabled={locked}
              required
            />
          </label>
          <label className="form-label">
            מספר טלפון
            <input
              className="form-input"
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              disabled={locked}
              required
            />
          </label>
        </section>

        <section className="rating-form-section">
          <h2 className="sheet-section-title sheet-section-title-primary">תפקיד</h2>
          <label className="form-label">
            תפקיד באלוט
            <RoleSearchInput
              name="role"
              value={roleId}
              onChange={handleRoleChange}
              required
              disabled={locked}
            />
          </label>
        </section>

        {anchorKeys.map((key, i) => (
          <section
            key={key}
            className="rating-anchor-block"
            style={{ '--rating-accent': ACCENTS[i % ACCENTS.length] }}
          >
            <h3 className="rating-anchor-title">{anchorLabelByKey[key]}</h3>
            <div className="rating-anchor-scale-row">
              {anchorLegendSubtextByKey[key] ? (
                <p className="rating-anchor-legend">{anchorLegendSubtextByKey[key]}</p>
              ) : null}
              <RatingScale
                name={anchorLabelByKey[key]}
                value={anchorScores[key]}
                onChange={(n) => setAnchor(key, n)}
                disabled={locked}
              />
            </div>
          </section>
        ))}

        {profile === RATING_PROFILE_PROFESSIONAL ? (
          <section className="rating-anchor-block rating-anchor-block--experience">
            <h3 className="rating-anchor-title">ניסיון רלוונטי (+3 שנים)</h3>
            <RatingScale
              name="ניסיון רלוונטי"
              value={experienceScore}
              onChange={setExperienceScore}
              disabled={locked}
            />
          </section>
        ) : null}

        <section
          className="rating-anchor-block rating-anchor-block--prediction"
          style={{ '--rating-accent': PREDICTION_ACCENT }}
        >
          <h3 className="rating-anchor-title">ניבוי המראיין</h3>
          <div className="rating-anchor-scale-row">
            <p className="rating-anchor-legend">הערכת המראיין לגבי התאמת המועמד.ת לתפקיד</p>
            <RatingScale
              name="ניבוי המראיין"
              value={predictionScore}
              onChange={setPredictionScore}
              disabled={locked}
            />
          </div>
        </section>

        <section className="rating-anchor-block rating-anchor-block--recommendation">
          <h3 className="rating-anchor-title">אחוז המלצה</h3>
          <p className="rating-hint">
            הזינו את אחוז ההמלצה משאלון הממליץ (0–100). 0 ייחשב כעצירת המלצה להמשך תהליך.
          </p>
          <label className="form-label">
            אחוז המלצה (%)
            <input
              className="form-input"
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              value={predictionPercent}
              onChange={(e) => setPredictionPercent(e.target.value)}
              disabled={locked}
            />
          </label>
        </section>

        {formError ? <p className="reference-score-error">{formError}</p> : null}

        <div className="reference-form-actions">
          <button type="submit" className="btn btn-primary" disabled={locked}>
            חשב ציון משוקלל
          </button>
        </div>
      </form>

      {locked && showResult && result ? (
        <>
          {result.final0to100 >= 80 ? <ConfettiCelebration burstKey={confettiBurstKey} /> : null}
          <div className="reference-trust-backdrop" aria-hidden />
          <div
            className="reference-trust-banner rating-result-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rating-result-title"
            aria-live="polite"
          >
            <button
              type="button"
              className="reference-trust-banner-close"
              onClick={handleCloseResult}
              aria-label="סגור"
            >
              ×
            </button>
            <div ref={resultPdfRef} className="reference-trust-pdf-root" dir="rtl">
              <p className="reference-trust-pdf-kicker">סיכום וציון ההצלחה</p>

              <section className="rating-result-section">
                <h2 className="rating-result-section-title">פרטי המועמד</h2>
                <div className="reference-trust-result-meta">
                  <div className="reference-trust-result-row">
                    <span className="reference-trust-result-label">שם המועמד.ת</span>
                    <span className="reference-trust-result-value">{result.applicantName}</span>
                  </div>
                  <div className="reference-trust-result-row">
                    <span className="reference-trust-result-label">טלפון</span>
                    <span className="reference-trust-result-value">{result.phone}</span>
                  </div>
                  <div className="reference-trust-result-row">
                    <span className="reference-trust-result-label">תפקיד</span>
                    <span className="reference-trust-result-value">{result.jobTitle}</span>
                  </div>
                  <div className="reference-trust-result-row">
                    <span className="reference-trust-result-label">אחוז המלצה</span>
                    <span className="reference-trust-result-value">{result.recommendationPercent}%</span>
                  </div>
                </div>
              </section>

              <section className="rating-result-section">
                <h2 className="rating-result-section-title">ציון ההצלחה</h2>
                <p id="rating-result-title" className="reference-trust-result-gradient">
                  ציון הצלחה {result.final0to100}%
                </p>
                {result.final0to100 === 0 ? (
                  <p className="reference-trust-zero-advisory">
                    על פי התוצאות, מומלץ לא להמשיך בתהליך הגיוס עם מועמד.ת זו.
                  </p>
                ) : null}
              </section>

              {resultAnchorSummary ? (
                <section className="rating-result-section">
                  <h2 className="rating-result-section-title">סיכום חוזקות מול חולשות</h2>
                  <div className="rating-result-summary-grid">
                    <div className="rating-result-summary-card">
                      <h3 className="rating-result-summary-title">חוזקות</h3>
                      {resultAnchorSummary.strengths.length > 0 ? (
                        <ul className="rating-result-list">
                          {resultAnchorSummary.strengths.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rating-result-empty">לא זוהו עוגנים בציון גבוה.</p>
                      )}
                    </div>

                    <div className="rating-result-summary-card">
                      <h3 className="rating-result-summary-title">חולשות / נקודות לחיזוק</h3>
                      {resultAnchorSummary.weaknesses.length > 0 ? (
                        <ul className="rating-result-list">
                          {resultAnchorSummary.weaknesses.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rating-result-empty">לא זוהו עוגנים בציון נמוך.</p>
                      )}
                    </div>

                    {resultAnchorSummary.neutral.length > 0 ? (
                      <div className="rating-result-summary-card">
                        <h3 className="rating-result-summary-title">אזור ביניים לבדיקה</h3>
                        <ul className="rating-result-list">
                          {resultAnchorSummary.neutral.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </section>
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

      {locked ? (
        <div className="page-bottom-home-actions no-print">
          <Link to="/" className="btn btn-secondary">
            חזרה לדף הבית
          </Link>
        </div>
      ) : null}
    </div>
  )
}
