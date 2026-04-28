import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AnchorColorLegend from '../components/AnchorColorLegend.jsx'
import { anchorKeys, anchorLabelByKey } from '../data/questionBank.js'
import {
  buildFocusRecommendation,
  FOCUS_INTRO,
  INTERVIEW_STRUCTURE_STEPS,
} from '../utils/buildFocusRecommendation.js'
import { selectPredictionQuestions } from '../utils/selectPredictionQuestions.js'
import { EXPERIENCE } from '../utils/selectAnchorQuestions.js'

function QuestionBlock({ anchorKey, children }) {
  const k = anchorKey ?? 'organization'
  return (
    <div className={`anchor-question-item anchor-q anchor-q--${k}`}>{children}</div>
  )
}

function formatQuestionItem(item, index) {
  const lines = [`${index + 1}. ${item.question}`]
  if (item.followUps?.length) {
    lines.push(...item.followUps.map((fu) => `   - ${fu}`))
  }
  return lines.join('\n')
}

function formatInterviewDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}

function buildInterviewWhatsAppText({
  applicantName,
  phone,
  interviewDate,
  positionLabel,
  notes,
  focusIntro,
  structureSteps,
  focusExtraBullets,
  selectedQuestions,
  predictionQuestions,
}) {
  const lines = [
    'שאלות לראיון',
    '',
    'פרטי המועמד:',
    `שם: ${applicantName || '—'}`,
    `טלפון: ${phone || '—'}`,
    `תאריך ראיון: ${formatInterviewDate(interviewDate)}`,
    `תפקיד: ${positionLabel || '—'}`,
  ]

  if (notes) {
    lines.push('', 'הערות המראיין:', notes)
  }

  lines.push(
    '',
    'המלצות מיקוד לראיון:',
    focusIntro.replace(' בחרו את השאלות הרלוונטיות.', ''),
    'בחרו את השאלות הרלוונטיות.',
    '',
    'מבנה מומלץ לראיון:',
    ...structureSteps.map((line, i) => `${i + 1}. ${line}`),
  )

  if (focusExtraBullets.length > 0) {
    lines.push('', 'המלצות נוספות לפי הפרטים שהזנתם:', ...focusExtraBullets.map((line) => `- ${line}`))
  }

  lines.push('', 'שאלות לפי עוגנים:')
  for (const key of anchorKeys) {
    const questions = selectedQuestions[key] ?? []
    lines.push('', `${anchorLabelByKey[key]}:`, ...questions.map(formatQuestionItem))
  }

  lines.push(
    '',
    'ניבוי — הערכת המראיין לגבי התאמה לתפקיד:',
    ...predictionQuestions.map(formatQuestionItem),
  )

  return lines.join('\n')
}

export default function InterviewQuestionsPage() {
  const sheetRef = useRef(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  const location = useLocation()
  const data = location.state

  if (!data?.selectedQuestions) {
    return <Navigate to="/prepare" replace />
  }

  const {
    applicantName,
    phone,
    interviewDate,
    positionLabel,
    positionId,
    notes,
    attachment,
    selectedQuestions,
    predictionQuestions: predictionFromState,
    focusRecommendation: focusFromState,
  } = data

  const predictionQuestions =
    predictionFromState?.length > 0 ? predictionFromState : selectPredictionQuestions()

  const focusRecommendation = buildFocusRecommendation({
    notes: notes ?? '',
    positionLabel,
    positionId: positionId ?? '',
    candidateExperience: focusFromState?.candidateExperience ?? EXPERIENCE.EARLY,
  })

  const focusIntro = FOCUS_INTRO
  const structureSteps = INTERVIEW_STRUCTURE_STEPS
  const focusExtraBullets = focusRecommendation.bullets ?? []

  async function handleDownloadPdf() {
    setPdfError(null)
    const el = sheetRef.current
    if (!el) return
    setPdfLoading(true)
    try {
      await document.fonts.ready
      const { downloadInterviewPdf, interviewPdfFileName } = await import(
        '../utils/downloadInterviewPdf.js'
      )
      await downloadInterviewPdf(el, interviewPdfFileName(applicantName))
    } catch (e) {
      console.error(e)
      setPdfError('יצירת הקובץ נכשלה. נסו שוב.')
    } finally {
      setPdfLoading(false)
    }
  }

  function handleShareWhatsApp() {
    const text = buildInterviewWhatsAppText({
      applicantName,
      phone,
      interviewDate,
      positionLabel,
      notes,
      focusIntro,
      structureSteps,
      focusExtraBullets,
      selectedQuestions,
      predictionQuestions,
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="interview-flow interview-page" dir="rtl">
      <div className="interview-page-toolbar no-print">
        <div className="sheet-toolbar interview-toolbar">
          <Link to="/prepare" className="btn btn-secondary">
            חזרה לעריכה
          </Link>
        </div>
      </div>

      <article ref={sheetRef} className="interview-sheet card interview-result-sheet">
        <header className="sheet-header interview-pdf-chunk">
          <h2 className="sheet-title">שאלות לראיון</h2>
          <dl className="sheet-meta">
            <div className="sheet-meta-row">
              <dt>מועמד.ת</dt>
              <dd>{applicantName}</dd>
            </div>
            <div className="sheet-meta-row">
              <dt>טלפון</dt>
              <dd>{phone}</dd>
            </div>
            <div className="sheet-meta-row">
              <dt>תאריך ראיון</dt>
              <dd>{formatInterviewDate(interviewDate)}</dd>
            </div>
            <div className="sheet-meta-row">
              <dt>תפקיד</dt>
              <dd>{positionLabel}</dd>
            </div>
            {attachment?.dataUrl && attachment?.fileName ? (
              <div className="sheet-meta-row">
                <dt>מסמך מצורף</dt>
                <dd>
                  <a
                    className="sheet-attachment-link"
                    href={attachment.dataUrl}
                    download={attachment.fileName}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {attachment.fileName}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          {notes ? (
            <section className="sheet-section sheet-notes-ref">
              <h3 className="sheet-section-title">הערות המראיין</h3>
              <p className="sheet-summary-text">{notes}</p>
            </section>
          ) : null}
        </header>

        <section className="sheet-section focus-recommendation interview-pdf-chunk">
          <h3 className="sheet-section-title sheet-section-title-primary">המלצות מיקוד לראיון</h3>
          <p className="focus-recommendation-intro">
            {focusIntro.replace(' בחרו את השאלות הרלוונטיות.', '')}
            <br />
            בחרו את השאלות הרלוונטיות.
          </p>
          <ol className="focus-recommendation-structure" start={1}>
            {structureSteps.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          {focusExtraBullets.length > 0 ? (
            <>
              <p className="focus-recommendation-extra-lead">המלצות נוספות לפי הפרטים שהזנתם:</p>
              <ul className="focus-recommendation-list">
                {focusExtraBullets.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <AnchorColorLegend className="interview-pdf-chunk" />

        <section className="sheet-section anchors">
          <div className="interview-pdf-chunk interview-anchors-intro">
            <h3 className="sheet-section-title sheet-section-title-primary">מבנה לפי עוגנים</h3>
            <p className="anchors-lead">
              לכל עוגן נבחרו בין 7 ל־10 שאלות מהבנק. צבע המסגרת מציין את עוגן ההערכה — בהתאם למקרא
              העוגנים למעלה.
            </p>
          </div>
          {anchorKeys.map((key) => {
            const title = anchorLabelByKey[key]
            const questions = selectedQuestions[key] ?? []
            return (
              <section key={key} className={`anchor-section anchor-section--${key}`}>
                <div className="interview-pdf-chunk interview-anchor-heading-chunk">
                  <h3 className="anchor-title">
                    {title}
                    <span className="anchor-count">({questions.length} שאלות)</span>
                  </h3>
                </div>
                <ol className="anchor-question-list anchor-question-list-expanded" start={1}>
                  {questions.map((item, qIndex) => (
                    <li key={qIndex} className="anchor-question-li">
                      <div
                        className="interview-pdf-chunk interview-pdf-question-wrap"
                        data-qnum={qIndex + 1}
                      >
                        <QuestionBlock anchorKey={key}>
                          <p className="anchor-question-text">{item.question}</p>
                          {item.followUps?.length ? (
                            <ul className="anchor-followups-list compact-followups">
                              {item.followUps.map((fu, fi) => (
                                <li key={fi}>{fu}</li>
                              ))}
                            </ul>
                          ) : null}
                        </QuestionBlock>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </section>

        <section className="sheet-section prediction-section">
          <div className="interview-pdf-chunk interview-prediction-intro">
            <h3 className="sheet-section-title sheet-section-title-primary">
              ניבוי — הערכת המראיין לגבי התאמה לתפקיד
            </h3>
            <p className="anchors-lead">
              נבחרו {predictionQuestions.length} שאלות (לפחות 7 כשהבנק מאפשר). שאלות אלו אינן משויכות
              לעוגני הערכה.
            </p>
          </div>
          <ol className="anchor-question-list anchor-question-list-expanded prediction-question-list" start={1}>
            {predictionQuestions.map((item, i) => (
              <li key={i} className="anchor-question-li">
                <div
                  className="interview-pdf-chunk interview-pdf-question-wrap"
                  data-qnum={i + 1}
                >
                  <div className="prediction-q-item">
                    <p className="anchor-question-text">{item.question}</p>
                    {item.followUps?.length ? (
                      <ul className="anchor-followups-list compact-followups">
                        {item.followUps.map((fu, fi) => (
                          <li key={fi}>{fu}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </article>

      <div className="interview-page-footer-actions no-print">
        {pdfError ? <p className="pdf-error-hint">{pdfError}</p> : null}
        <button
          type="button"
          className="btn btn-primary interview-footer-pdf-btn"
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'מייצר PDF…' : 'הורד כ־PDF'}
        </button>
        <button
          type="button"
          className="btn btn-secondary interview-footer-whatsapp-btn"
          onClick={handleShareWhatsApp}
        >
          שליחה ב־WhatsApp
        </button>
        <Link to="/" className="btn btn-secondary interview-footer-home-btn">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
