/** מיפוי תשובה (1–3) לנקודות: 1→1, 2→3, 3→5 */
export function choiceToPoints(choice) {
  const n = Number(choice)
  if (n === 1) return 1
  if (n === 2) return 3
  if (n === 3) return 5
  return null
}

/**
 * @param {string[]} selectedValues - ערכי '1'|'2'|'3' לפי סדר השאלות
 * @returns {{ raw: number, grade0to100: number, questionCount: number }}
 */
export function computeReferenceQuestionnaireScore(selectedValues) {
  const questionCount = selectedValues.length
  if (questionCount === 0) {
    return { raw: 0, grade0to100: 0, questionCount: 0 }
  }

  let raw = 0
  for (const v of selectedValues) {
    const p = choiceToPoints(v)
    if (p == null) {
      return { raw: 0, grade0to100: NaN, questionCount }
    }
    raw += p
  }

  const min = questionCount * 1
  const max = questionCount * 5
  const grade0to100 = Math.round(((raw - min) / (max - min)) * 100)

  return { raw, grade0to100, questionCount }
}
