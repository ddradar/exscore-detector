/**
 * Calculates the normal score based on the given judgement counts.
 * @param {number} totalNotes Total notes + freeze arrows + shock arrows
 * @param {number} marvelousAndOk Marvelous + OK count
 * @param {number} perfect Perfect count
 * @param {number} great Great count
 * @param {number} good Good count
 * @returns {number} The calculated normal score
 */
export function calcNormalScore(
  totalNotes,
  marvelousAndOk,
  perfect,
  great,
  good,
) {
  // [Base score]: 1000000 / (notes + freezes + shocks)
  // - Marvelous & OK = [Base score]
  // - Perfect = [Base score] - 10
  // - Great = ([Base score] * 0.6) - 10
  // - Good = ([Base score] * 0.2) - 10
  // - Miss = 0
  // Total score is rounded down to the nearest 10.
  return (
    Math.floor(
      (100000 * (marvelousAndOk + perfect) + 60000 * great + 20000 * good) /
        totalNotes -
        perfect -
        great -
        good,
    ) * 10
  )
}

/**
 * Calculates the EX score based on the given judgement counts.
 * @param {number} marvelousAndOk Marvelous + OK count
 * @param {number} perfect Perfect count
 * @param {number} great Great count
 * @returns {number} The calculated EX score
 */
export function calcExScore(marvelousAndOk, perfect, great) {
  // - Marvelous & OK = 3
  // - Perfect = 2
  // - Great = 1
  // - Good & Miss = 0
  // Max score varies depending on the chart.
  return marvelousAndOk * 3 + perfect * 2 + great
}

/**
 *
 * @param {number} normalNotes Notes count (exclude Freeze arrows & Shock arrows)
 * @param {number} okCount OK count (Freeze arrows & Shock arrows)
 * @param {number} normalScore Normal score (0-1000000)
 * @returns {Array<Object>} Array of inferred judgement counts with exScore
 */
export function inferJudgementCounts(normalNotes, okCount, normalScore) {
  const notes = Number(normalNotes)
  const ok = Number(okCount)
  const score = Number(normalScore)

  if (!Number.isInteger(notes) || notes < 0) {
    throw new TypeError(
      `normalNotes must be a non-negative integer: ${normalNotes}`,
    )
  }

  if (!Number.isInteger(ok) || ok < 0) {
    throw new TypeError(`okCount must be a non-negative integer: ${okCount}`)
  }

  if (!Number.isInteger(score) || score < 0 || score > 1000000) {
    throw new TypeError(
      `normalScore must be an integer between 0 and 1000000: ${normalScore}`,
    )
  }

  const candidates = []
  const total = notes + ok
  const maxMiss = notes
  const theoreticalMaxExScore = calcExScore(total, 0, 0)

  for (let miss = 0; miss <= maxMiss; miss++) {
    const bestPossibleScoreAtThisMiss = calcNormalScore(
      total,
      total - miss,
      0,
      0,
      0,
    )

    if (bestPossibleScoreAtThisMiss < score) break

    for (let perfect = 0; perfect <= notes; perfect++) {
      for (let great = 0; great <= notes - perfect; great++) {
        for (let good = 0; good <= notes - perfect - great; good++) {
          const marvelous = total - ok - miss - perfect - great - good

          if (marvelous < 0) continue
          if (marvelous < perfect) continue

          const computed = calcNormalScore(
            total,
            marvelous + ok,
            perfect,
            great,
            good,
          )

          if (computed !== score) continue

          const exScore = calcExScore(marvelous + ok, perfect, great)

          // A non-perfect normal score can never produce the theoretical max EX score.
          if (score < 1000000 && exScore === theoreticalMaxExScore) {
            continue
          }

          candidates.push({
            marvelous,
            perfect,
            great,
            good,
            ok,
            miss,
            exScore,
          })
        }
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      `Could not infer judgement breakdown for normalNotes=${notes}, okCount=${ok}, normalScore=${score}`,
    )
  }

  candidates.sort((a, b) => {
    const aBad = a.perfect + a.great + a.good
    const bBad = b.perfect + b.great + b.good

    return (
      a.miss - b.miss ||
      aBad - bBad ||
      a.good - b.good ||
      a.great - b.great ||
      a.perfect - b.perfect ||
      b.marvelous - a.marvelous
    )
  })

  return candidates
}

export function formatRange(min, max) {
  return min === max ? String(min) : `${min}-${max}`
}

export function aggregateCandidatesByExScore(candidates) {
  const grouped = new Map()

  candidates.forEach(candidate => {
    const key = candidate.exScore
    if (!grouped.has(key)) {
      grouped.set(key, {
        exScore: candidate.exScore,
        marvelousMin: candidate.marvelous,
        marvelousMax: candidate.marvelous,
        perfectMin: candidate.perfect,
        perfectMax: candidate.perfect,
        greatMin: candidate.great,
        greatMax: candidate.great,
        goodMin: candidate.good,
        goodMax: candidate.good,
        okMin: candidate.ok,
        okMax: candidate.ok,
        missMin: candidate.miss,
        missMax: candidate.miss,
        patterns: 1,
      })
      return
    }

    const item = grouped.get(key)
    item.marvelousMin = Math.min(item.marvelousMin, candidate.marvelous)
    item.marvelousMax = Math.max(item.marvelousMax, candidate.marvelous)
    item.perfectMin = Math.min(item.perfectMin, candidate.perfect)
    item.perfectMax = Math.max(item.perfectMax, candidate.perfect)
    item.greatMin = Math.min(item.greatMin, candidate.great)
    item.greatMax = Math.max(item.greatMax, candidate.great)
    item.goodMin = Math.min(item.goodMin, candidate.good)
    item.goodMax = Math.max(item.goodMax, candidate.good)
    item.okMin = Math.min(item.okMin, candidate.ok)
    item.okMax = Math.max(item.okMax, candidate.ok)
    item.missMin = Math.min(item.missMin, candidate.miss)
    item.missMax = Math.max(item.missMax, candidate.miss)
    item.patterns += 1
  })

  return [...grouped.values()].sort((a, b) => b.exScore - a.exScore)
}
