/**
 * תפקידים באלוט — מסלול משפיע על בחירת שאלות והמלצות מיקוד.
 * הרשימה ממוינת לפי א״ב עברית (label).
 */
export const JOB_TRACK = {
  ENTRY: 'entry',
  PROFESSIONAL: 'professional',
  MANAGERIAL: 'managerial',
}

/** @typedef {{ id: string, label: string, track: 'entry' | 'professional' | 'managerial' }} PositionDef */

/** @type {PositionDef[]} */
const POSITIONS_RAW = [
  { id: 'nurse', label: 'אח.ות', track: 'professional' },
  { id: 'maintenance', label: 'איש אחזקה', track: 'entry' },
  { id: 'house_parent', label: 'אם בית', track: 'professional' },
  { id: 'ganenet', label: 'גננת', track: 'professional' },
  { id: 'instructor_hostel', label: 'מדריכ.ה הוסטל', track: 'entry' },
  { id: 'instructor_club', label: 'מדריכ.ה מועדונית', track: 'entry' },
  { id: 'instructor_mitel', label: 'מדריכ.ה מיתל', track: 'entry' },
  { id: 'instructor_daycamp', label: 'מדריכ.ה קייטנה', track: 'entry' },
  { id: 'learning_class_teacher', label: 'מורה לכיתת למידה', track: 'professional' },
  { id: 'emotional_therapist', label: 'מטפלת רגשית', track: 'professional' },
  { id: 'manager_alutaf', label: 'מנהל.ת אלוטף', track: 'managerial' },
  { id: 'manager_hostel', label: 'מנהל.ת הוסטל', track: 'managerial' },
  { id: 'manager_club', label: 'מנהל.ת מועדונית', track: 'managerial' },
  { id: 'manager_mitel', label: 'מנהל.ת מיתל', track: 'managerial' },
  { id: 'behavior_analyst', label: 'מנתח.ת התנהגות', track: 'professional' },
  { id: 'occupational_therapist', label: 'מרפאה בעיסוק', track: 'professional' },
  { id: 'assistant_alutaf', label: 'סייעת אלוטף', track: 'entry' },
  { id: 'assistant_gan', label: 'סייעת גנים', track: 'entry' },
  { id: 'assistant_admin', label: 'סייעת מנהלתית', track: 'entry' },
  { id: 'social_worker_abv', label: 'עו״ס', track: 'professional' },
  { id: 'social_worker_welfare', label: 'עו״ס רווחה', track: 'professional' },
  { id: 'physiotherapist', label: 'פיזיותרפיסט.ית', track: 'professional' },
  { id: 'speech_therapist', label: 'קלינאית תקשורת', track: 'professional' },
  { id: 'coordinator', label: 'רכז.ת', track: 'managerial' },
  { id: 'coordinator_therapy', label: 'רכז.ת טיפול', track: 'managerial' },
]

/** רשימה ממוינת לפי תווית (א״ב עברית) — לתפריט בחירה */
export const positions = [...POSITIONS_RAW].sort((a, b) => a.label.localeCompare(b.label, 'he'))

export function getPositionById(id) {
  return positions.find((p) => p.id === id) ?? null
}

export function getPositionLabel(id) {
  return getPositionById(id)?.label ?? ''
}

export function getPositionTrack(id) {
  return getPositionById(id)?.track ?? 'professional'
}
