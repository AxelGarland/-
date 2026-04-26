import { predictionQuestionBank } from '../data/questionBank.js'

const MIN_COUNT = 7
const MAX_COUNT = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * בוחר בין 7 ל־10 שאלות ניבוי מהבנק (לפי גודל הבנק).
 */
export function selectPredictionQuestions() {
  const pool = predictionQuestionBank.interviewerRoleFit
  if (!pool?.length) return []
  const cap = Math.min(MAX_COUNT, pool.length)
  const floor = Math.min(MIN_COUNT, pool.length)
  const want = randomIntInclusive(floor, cap)
  const n = Math.min(want, pool.length)
  return shuffle([...pool]).slice(0, n).map((item) => ({
    ...item,
    followUps: [...item.followUps],
  }))
}
