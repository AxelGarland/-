import {
  calculateFinalScore,
  getStrengthsAndWeaknesses,
} from './calculateFinalScore.js'

/**
 * Thresholds: >= 4 strength, <= 2.5 weakness, between = neutral (excluded from lists).
 * Labels: SCORE_DIMENSION_LABELS in calculateFinalScore.js
 */

const PARAGRAPH_MORE_STRENGTHS =
  'המועמד.ת מציג התאמה טובה במספר היבטים מרכזיים...'

const PARAGRAPH_MORE_WEAKNESSES = 'נדרשת בחינה נוספת של התאמת המועמד.ת...'

const PARAGRAPH_BALANCED = 'המועמד.ת מציג תמונה מעורבת...'

const PARAGRAPH_INCOMPLETE =
  'מלאו את כל הציונים בכל העוגנים ובניבוי המראיין כדי לקבל ציון משוקלל וסיכום מלא.'

/**
 * @param {Record<string, number | null>} scores
 * @returns {{
 *   finalScore: number | null,
 *   strengths: string[],
 *   weaknesses: string[],
 *   professionalSummary: string
 * }}
 */
export function generateSummary(scores) {
  const finalScore = calculateFinalScore(scores)
  const { strengths, weaknesses } = getStrengthsAndWeaknesses(scores)

  let professionalSummary = PARAGRAPH_BALANCED

  if (finalScore == null) {
    professionalSummary = PARAGRAPH_INCOMPLETE
  } else if (strengths.length === 0 && weaknesses.length === 0) {
    professionalSummary = PARAGRAPH_BALANCED
  } else if (strengths.length > weaknesses.length) {
    professionalSummary = PARAGRAPH_MORE_STRENGTHS
  } else if (weaknesses.length > strengths.length) {
    professionalSummary = PARAGRAPH_MORE_WEAKNESSES
  } else {
    professionalSummary = PARAGRAPH_BALANCED
  }

  return {
    finalScore,
    strengths,
    weaknesses,
    professionalSummary,
  }
}
