export function calcNormalScore(totalNotes, marvelousAndOk, perfect, great, good) {
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

export function inferExScore(totalNotes, judgement) {
  const total = Number(totalNotes)
  const { perfect = 0, great = 0, good = 0 } = judgement
  return total * 3 - perfect - great * 2 - good * 3
}

export function inferJudgementCounts(
  normalNotes,
  okCount,
  normalScore,
  fullComboType
) {
  const notes = Number(normalNotes)
  const ok = Number(okCount)
  const score = Number(normalScore)
  const rawType = fullComboType == null ? '' : String(fullComboType).trim()
  const type = rawType ? rawType.toUpperCase() : null

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

  if (type && !['MFC', 'PFC', 'GFC', 'FC'].includes(type)) {
    throw new TypeError(
      `fullComboType must be one of MFC, PFC, GFC, FC: ${fullComboType}`
    )
  }

  if (type === 'MFC') {
    if (score !== 1000000) {
      throw new Error(
        `MFC must resolve to 1000000 normal score, got ${score} for ${notes + ok} notes`
      )
    }

    return [
      {
        marvelous: notes + ok,
        perfect: 0,
        great: 0,
        good: 0,
        ok,
        miss: 0,
        exScore: (notes + ok) * 3,
      },
    ]
  }

  const candidates = []
  const total = notes + ok
  const maxMiss = notes

  for (let miss = 0; miss <= maxMiss; miss++) {
    if (type && miss !== 0) continue

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
          if (type === 'PFC' && (great !== 0 || good !== 0)) continue
          if (type === 'GFC' && good !== 0) continue
          if (type === 'FC' && perfect === 0 && great === 0 && good === 0) {
            continue
          }

          const computed = calcNormalScore(
            total,
            marvelous + ok,
            perfect,
            great,
            good
          )

          if (computed !== score) continue

          candidates.push({
            marvelous,
            perfect,
            great,
            good,
            ok,
            miss,
            exScore: inferExScore(total, { perfect, great, good }),
          })
        }
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      `Could not infer judgement breakdown for normalNotes=${notes}, okCount=${ok}, normalScore=${score}, fullComboType=${type ?? 'unknown'}`
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

  candidates.forEach((candidate) => {
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
