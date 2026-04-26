import { anchorKeys, questionBank } from '../data/questionBank.js'
import { getPositionTrack } from '../data/positions.js'

/** הערכת המראיין לניסיון המועמד.ת (ללא AI) */
export const EXPERIENCE = {
  NONE: 'none',
  EARLY: 'early',
  EXPERIENCED: 'experienced',
}

const MIN_PER_ANCHOR = 7
const MAX_PER_ANCHOR = 10

function copyQ(item) {
  return { ...item, followUps: [...item.followUps] }
}

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** בוחר עד n אינדקסים ייחודיים מתוך pool */
function pickNFromPool(n, indexPool) {
  if (n <= 0 || !indexPool.length) return []
  const cap = Math.min(n, indexPool.length)
  return shuffle(indexPool).slice(0, cap)
}

function targetCountForAnchor(itemCount) {
  const want = randomIntInclusive(MIN_PER_ANCHOR, MAX_PER_ANCHOR)
  return Math.min(want, itemCount)
}

/**
 * מסלול כניסה: חלוקה בין junior לסטנדרטי כשמועמד.ת אינו “מנוסה”.
 */
function pickForEntryTrack(items, candidateExperience) {
  if (!items?.length) return []

  const n = targetCountForAnchor(items.length)
  const juniorIdx = []
  const standardIdx = []
  items.forEach((it, i) => {
    if (it.tier === 'junior') juniorIdx.push(i)
    else standardIdx.push(i)
  })

  const isExperienced = candidateExperience === EXPERIENCE.EXPERIENCED
  const allIdx = items.map((_, i) => i)

  if (isExperienced) {
    if (standardIdx.length >= n) {
      return pickNFromPool(n, standardIdx)
        .sort((a, b) => a - b)
        .map((i) => copyQ(items[i]))
    }
    const fromStd = pickNFromPool(Math.min(n, standardIdx.length), standardIdx)
    const need = n - fromStd.length
    const fromJnr = need > 0 ? pickNFromPool(need, juniorIdx) : []
    return [...fromStd, ...fromJnr]
      .sort((a, b) => a - b)
      .map((i) => copyQ(items[i]))
  }

  if (juniorIdx.length && standardIdx.length) {
    let jWant = Math.min(
      juniorIdx.length,
      Math.max(2, Math.round(n * 0.35)),
      Math.max(0, n - 1),
    )
    let sWant = n - jWant
    if (sWant > standardIdx.length) {
      sWant = standardIdx.length
      jWant = Math.min(n - sWant, juniorIdx.length)
    }
    const picked = new Set()
    for (const i of pickNFromPool(jWant, juniorIdx)) picked.add(i)
    for (const i of pickNFromPool(sWant, standardIdx)) picked.add(i)
    const merged = [...picked]
    if (merged.length < n) {
      const rest = allIdx.filter((i) => !picked.has(i))
      for (const i of pickNFromPool(n - merged.length, rest)) merged.push(i)
    }
    return merged
      .sort((a, b) => a - b)
      .map((i) => copyQ(items[i]))
  }

  return pickNFromPool(n, allIdx)
    .sort((a, b) => a - b)
    .map((i) => copyQ(items[i]))
}

function pickRandomMany(items) {
  if (!items?.length) return []
  const n = targetCountForAnchor(items.length)
  const pool = items.map((_, i) => i)
  return pickNFromPool(n, pool)
    .sort((a, b) => a - b)
    .map((i) => copyQ(items[i]))
}

/**
 * @param {{ positionId: string, candidateExperience: string }} params
 * @returns {Record<string, Array<{ question: string, followUps: string[], tier?: string }>>}
 */
export function selectQuestionsPerAnchor({ positionId, candidateExperience }) {
  const track = getPositionTrack(positionId)
  const out = {}

  for (const key of anchorKeys) {
    const items = questionBank[key]
    if (track === 'entry') {
      out[key] = pickForEntryTrack(items, candidateExperience)
    } else {
      out[key] = pickRandomMany(items)
    }
  }
  return out
}

/** @deprecated — נשמר לתאימות; השתמשו ב־selectQuestionsPerAnchor */
export function selectTwoPerAnchor() {
  const out = {}
  for (const key of anchorKeys) {
    out[key] = pickRandomMany(questionBank[key]).slice(0, 2)
  }
  return out
}
