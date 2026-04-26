/** Weights sum to 1.0 */
export const SCORE_WEIGHTS = {
  organization: 0.15,
  duty: 0.15,
  excellence: 0.1,
  proactivity: 0.1,
  social: 0.15,
  workType: 0.05,
  prediction: 0.3,
}

/**
 * @param {Record<string, number | null>} scores
 * @returns {number | null} Weighted average 1–5, or null if any score missing
 */
export function calculateFinalScore(scores) {
  const keys = Object.keys(SCORE_WEIGHTS)
  for (const k of keys) {
    const v = scores[k]
    if (v == null || typeof v !== 'number' || v < 1 || v > 5) {
      return null
    }
  }
  let sum = 0
  for (const k of keys) {
    sum += scores[k] * SCORE_WEIGHTS[k]
  }
  return Math.round(sum * 10) / 10
}

/** Hebrew labels for insight lists */
export const SCORE_DIMENSION_LABELS = {
  organization: 'עובד כחלק מארגון',
  duty: 'חוש חובה',
  excellence: 'הצטיינות',
  proactivity: 'פרואקטיביות ומוטיבציה',
  social: 'חברתיות ויחסי אנוש',
  workType: 'סוג העבודה',
  prediction: 'ניבוי המראיין',
}

/** Strength / weakness thresholds (neutral strictly between, not listed). */
export const STRENGTH_MIN = 4
export const WEAKNESS_MAX = 2.5

/**
 * @param {Record<string, number | null>} scores
 * @returns {{ strengths: string[], weaknesses: string[] }}
 */
export function getStrengthsAndWeaknesses(scores) {
  const strengths = []
  const weaknesses = []
  for (const key of Object.keys(SCORE_DIMENSION_LABELS)) {
    const s = scores[key]
    if (s == null || typeof s !== 'number') continue
    const label = SCORE_DIMENSION_LABELS[key]
    if (s >= STRENGTH_MIN) strengths.push(label)
    if (s <= WEAKNESS_MAX) weaknesses.push(label)
  }
  return { strengths, weaknesses }
}
