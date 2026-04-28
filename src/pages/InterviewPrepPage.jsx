import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeroBanner from '../components/AppHeroBanner.jsx'
import RoleSearchInput from '../components/RoleSearchInput.jsx'
import { isValidDemoRoleId } from '../data/demoRoles.js'
import { getPositionLabel } from '../data/positions.js'
import { buildFocusRecommendation } from '../utils/buildFocusRecommendation.js'
import { readFileAsDataUrl } from '../utils/readFileAsDataUrl.js'
import { selectPredictionQuestions } from '../utils/selectPredictionQuestions.js'
import { EXPERIENCE, selectQuestionsPerAnchor } from '../utils/selectAnchorQuestions.js'

const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024
const ATTACHMENT_ACCEPT = '.doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'

function isAllowedAttachmentName(name) {
  return /\.(doc|docx|pdf)$/i.test(name ?? '')
}

function getTodayDateInputValue() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export default function InterviewPrepPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [applicantName, setApplicantName] = useState('')
  const [phone, setPhone] = useState('')
  const [interviewDate, setInterviewDate] = useState(getTodayDateInputValue)
  const [roleId, setRoleId] = useState('')
  const [notes, setNotes] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentLoading, setAttachmentLoading] = useState(false)
  const [attachmentError, setAttachmentError] = useState(null)

  const canSubmit = Boolean(
    applicantName.trim() && phone.trim() && interviewDate && isValidDemoRoleId(roleId) && !attachmentLoading,
  )

  async function handleAttachmentChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setAttachmentError(null)
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachment(null)
      setAttachmentError(`הקובץ גדול מדי (מקסימום ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} מ״ב).`)
      return
    }
    if (!isAllowedAttachmentName(file.name)) {
      setAttachment(null)
      setAttachmentError('נא לבחור קובץ Word (.doc, .docx) או PDF — למשל ייצוא מ־Google Docs כ־.docx.')
      return
    }

    setAttachmentLoading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setAttachment({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
      })
    } catch {
      setAttachment(null)
      setAttachmentError('לא ניתן לקרוא את הקובץ. נסו קובץ אחר.')
    } finally {
      setAttachmentLoading(false)
    }
  }

  function handleRemoveAttachment() {
    setAttachment(null)
    setAttachmentError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    const notesTrim = notes.trim()
    const selectedQuestions = selectQuestionsPerAnchor({
      positionId: roleId,
      candidateExperience: EXPERIENCE.EARLY,
    })
    const focusRecommendation = buildFocusRecommendation({
      notes: notesTrim,
      positionLabel: getPositionLabel(roleId),
      positionId: roleId,
      candidateExperience: EXPERIENCE.EARLY,
    })
    const predictionQuestions = selectPredictionQuestions()

    navigate('/interview', {
      state: {
        applicantName: applicantName.trim(),
        phone: phone.trim(),
        interviewDate,
        positionId: roleId,
        positionLabel: getPositionLabel(roleId),
        notes: notesTrim,
        attachment,
        selectedQuestions,
        predictionQuestions,
        focusRecommendation,
      },
    })
  }

  return (
    <div className="prep-page" dir="rtl">
      <AppHeroBanner />
      <header className="prep-header no-print">
        <Link to="/" className="prep-back">
          ← חזרה לדף הבית
        </Link>
        <h1 className="prep-title">הכנה לראיון</h1>
        <p className="prep-lead">
          מלאו את הפרטים — לכל עוגן יוצגו בין 7 ל־10 שאלות מבנק השאלות והמלצות מיקוד לפי מה שכתבתם.
          הכלי מיועד לשימוש המראיין בלבד.
        </p>
      </header>

      <form className="card prep-form no-print" onSubmit={handleSubmit}>
        <div className="form-stack">
          <label className="form-label">
            שם המועמד.ת
            <input
              className="form-input"
              name="applicantName"
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              autoComplete="name"
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
              required
            />
          </label>

          <label className="form-label">
            תאריך ראיון
            <input
              className="form-input"
              name="interviewDate"
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            תפקיד באלוט
            <RoleSearchInput
              name="role"
              value={roleId}
              onChange={setRoleId}
              required
            />
          </label>

          <label className="form-label">
            מידע על המועמד.ת (גיל, ניסיון, הערות קצרות)
            <textarea
              className="form-textarea form-textarea-compact"
              name="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="לדוגמה: גיל, רקע, נקודות מהשיחה המקדימה..."
            />
          </label>

          <div className="form-label">
            <span className="form-label-text">מסמך מצורף (אופציונלי)</span>
            <p className="form-hint">
              קובץ Word (.doc, .docx) או PDF — למשל קורות חיים או סיכום מ־Google Docs (ייצוא כ־Word). עד{' '}
              {MAX_ATTACHMENT_BYTES / (1024 * 1024)} מ״ב. הקובץ נשמר בדפדפן בלבד למעבר לגיליון הראיון.
            </p>
            <input
              ref={fileInputRef}
              id="prep-attachment"
              name="attachment"
              type="file"
              className="form-file-input"
              accept={ATTACHMENT_ACCEPT}
              onChange={handleAttachmentChange}
              disabled={attachmentLoading}
            />
            {attachmentLoading ? (
              <p className="form-hint form-hint-inline">טוען קובץ…</p>
            ) : null}
            {attachment ? (
              <div className="form-file-summary">
                <span className="form-file-name" title={attachment.fileName}>
                  {attachment.fileName}
                </span>
                <button
                  type="button"
                  className="form-file-remove"
                  onClick={handleRemoveAttachment}
                >
                  הסר
                </button>
              </div>
            ) : null}
            {attachmentError ? <p className="form-file-error">{attachmentError}</p> : null}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            קבל שאלות לראיון
          </button>
        </div>
      </form>
    </div>
  )
}
