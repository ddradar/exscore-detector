/**
 * Calculates the normal score based on the given judgement counts.
 * @param totalNotes Total notes + freeze arrows + shock arrows
 * @param marvelousAndOk Marvelous + OK count
 * @param perfect Perfect count
 * @param great Great count
 * @param good Good count
 * @returns The calculated normal score
 */
export function calcNormalScore(
  totalNotes: number,
  marvelousAndOk: number,
  perfect: number,
  great: number,
  good: number
): number {
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
        good
    ) * 10
  )
}

/**
 * Calculates the EX score based on the given judgement counts.
 * @param marvelousAndOk Marvelous + OK count
 * @param perfect Perfect count
 * @param great Great count
 * @returns The calculated EX score
 */
export function calcExScore(
  marvelousAndOk: number,
  perfect: number,
  great: number
): number {
  // - Marvelous & OK = 3
  // - Perfect = 2
  // - Great = 1
  // - Good & Miss = 0
  // Max score varies depending on the chart.
  return marvelousAndOk * 3 + perfect * 2 + great
}

interface InferCandidate {
  marvelous: number
  perfect: number
  great: number
  good: number
  ok: number
  miss: number
  exScore: number
}

interface JudgementRange {
  min: number
  max: number
}

interface ExScoreAggregate {
  exScore: number
  marvelous: JudgementRange
  perfect: JudgementRange
  great: JudgementRange
  good: JudgementRange
  ok: JudgementRange
  miss: JudgementRange
  patterns: number
}

/**
 *
 * @param normalNotes Notes count (exclude Freeze arrows & Shock arrows)
 * @param okCount OK count (Freeze arrows & Shock arrows)
 * @param normalScore Normal score (0-1000000)
 * @returns Array of inferred judgement counts with exScore
 */
export function inferJudgementCounts(
  normalNotes: number,
  okCount: number,
  normalScore: number
): InferCandidate[] {
  const notes = Number(normalNotes)
  const ok = Number(okCount)
  const score = Number(normalScore)

  if (!Number.isInteger(notes) || notes < 0) {
    throw new TypeError(
      `normalNotes must be a non-negative integer: ${normalNotes}`
    )
  }

  if (!Number.isInteger(ok) || ok < 0) {
    throw new TypeError(`okCount must be a non-negative integer: ${okCount}`)
  }

  if (!Number.isInteger(score) || score < 0 || score > 1000000) {
    throw new TypeError(
      `normalScore must be an integer between 0 and 1000000: ${normalScore}`
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
      0
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
            good
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
      `Could not infer judgement breakdown for normalNotes=${notes}, okCount=${ok}, normalScore=${score}`
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

/**
 * @param candidates Candidate list to aggregate by EX score
 * @returns Aggregated candidates grouped by EX score
 */
export function aggregateCandidatesByExScore(
  candidates: InferCandidate[]
): ExScoreAggregate[] {
  const grouped = new Map()

  candidates.forEach(candidate => {
    const key = candidate.exScore
    if (!grouped.has(key)) {
      grouped.set(key, {
        exScore: candidate.exScore,
        marvelous: { min: candidate.marvelous, max: candidate.marvelous },
        perfect: { min: candidate.perfect, max: candidate.perfect },
        great: { min: candidate.great, max: candidate.great },
        good: { min: candidate.good, max: candidate.good },
        ok: { min: candidate.ok, max: candidate.ok },
        miss: { min: candidate.miss, max: candidate.miss },
        patterns: 1,
      })
      return
    }

    const item = grouped.get(key)
    item.marvelous.min = Math.min(item.marvelous.min, candidate.marvelous)
    item.marvelous.max = Math.max(item.marvelous.max, candidate.marvelous)
    item.perfect.min = Math.min(item.perfect.min, candidate.perfect)
    item.perfect.max = Math.max(item.perfect.max, candidate.perfect)
    item.great.min = Math.min(item.great.min, candidate.great)
    item.great.max = Math.max(item.great.max, candidate.great)
    item.good.min = Math.min(item.good.min, candidate.good)
    item.good.max = Math.max(item.good.max, candidate.good)
    item.ok.min = Math.min(item.ok.min, candidate.ok)
    item.ok.max = Math.max(item.ok.max, candidate.ok)
    item.miss.min = Math.min(item.miss.min, candidate.miss)
    item.miss.max = Math.max(item.miss.max, candidate.miss)
    item.patterns += 1
  })

  return [...grouped.values()].sort((a, b) => b.exScore - a.exScore)
}
