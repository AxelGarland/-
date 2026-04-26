import { anchorKeys } from '../data/questionBank.js'

/** מסלול משקלים לשאלון הדירוג */
export const RATING_PROFILE_ENTRY = 'entry'
export const RATING_PROFILE_PROFESSIONAL = 'professional'

export const ratingProfileLabel = {
  [RATING_PROFILE_ENTRY]: 'מועמד צעיר / תפקיד לא מקצועי',
  [RATING_PROFILE_PROFESSIONAL]: 'מועמד עם ניסיון / תפקיד מקצועי',
}

/**
 * משקלים (סכום 1). ניבוי = דירוג ניבוי המראיין 1–5.
 * אחוז המלצה = ציון משאלון ממליץ 0–100, וגם כלל עצירה אם הוא 0.
 */
const ENTRY_WEIGHTS = {
  organization: 0.1,
  duty: 0.125,
  social: 0.125,
  prediction: 0.3,
  excellence: 0.05,
  proactivity: 0.05,
  workType: 0.05,
  recommendation: 0.2,
}

const PROFESSIONAL_WEIGHTS = {
  prediction: 0.3,
  experience: 0.15,
  recommendation: 0.15,
  organization: 0.1,
  duty: 0.1,
  excellence: 0.05,
  proactivity: 0.05,
  workType: 0.05,
  social: 0.05,
}

/** 1 (נמוך) … 5 (גבוה) → 0 … 1 */
export function normalizeScale1to5(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1 || n > 5) return null
  return (n - 1) / 4
}

function getWeights(profile) {
  return profile === RATING_PROFILE_PROFESSIONAL ? PROFESSIONAL_WEIGHTS : ENTRY_WEIGHTS
}

/**
 * @param {{
 *   profile: typeof RATING_PROFILE_ENTRY | typeof RATING_PROFILE_PROFESSIONAL,
 *   anchorScores: Record<string, number | string>,
 *   predictionScore: number | string,
 *   predictionPercent: number,
 *   experienceScore?: number | string | null,
 * }} p
 * @returns {{ final0to100: number, blocked: boolean }}
 */
export function computeRatingQuestionnaireFinal(p) {
  const { profile, anchorScores, predictionScore, predictionPercent, experienceScore } = p
  const pred = Number(predictionPercent)
  if (!Number.isFinite(pred) || pred < 0 || pred > 100) {
    return { final0to100: NaN, blocked: false }
  }
  if (pred <= 0) {
    return { final0to100: 0, blocked: true }
  }

  const weights = getWeights(profile)
  let sum = 0

  for (const key of anchorKeys) {
    const w = weights[key]
    if (w == null) continue
    const norm = normalizeScale1to5(anchorScores[key])
    if (norm == null) return { final0to100: NaN, blocked: false }
    sum += w * norm
  }

  if (profile === RATING_PROFILE_PROFESSIONAL) {
    const wExp = weights.experience
    const normExp = normalizeScale1to5(experienceScore)
    if (normExp == null) return { final0to100: NaN, blocked: false }
    sum += wExp * normExp
  }

  const normPrediction = normalizeScale1to5(predictionScore)
  if (normPrediction == null) return { final0to100: NaN, blocked: false }
  sum += weights.prediction * normPrediction
  sum += weights.recommendation * (pred / 100)

  return { final0to100: Math.round(sum * 100), blocked: false }
}
