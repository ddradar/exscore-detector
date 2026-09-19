import { describe, expect, it } from 'vitest'

import {
  aggregateCandidatesByExScore,
  calcNormalScore,
  calcExScore,
  inferJudgementCounts,
} from '../../src/core/score.js'

describe('/src/core/score.js', () => {
  it.each([
    [100, 80, 10, 5, 5, 939800], // Normal (FC)
    [100, 100, 0, 0, 0, 1000000], // MFC
    [7, 6, 0, 1, 0, 942840], // Rounding down case
    [10, 7, 1, 1, 0, 859980], // Mid-song drop
    [10, 0, 0, 0, 0, 0], // Zero-score
  ])(
    'calcNormalScore(%i, %i, %i, %i, %i) returns %i',
    (totalNotes, marvelousAndOk, perfect, great, good, expected) => {
      expect(
        calcNormalScore(totalNotes, marvelousAndOk, perfect, great, good),
      ).toBe(expected)
    },
  )

  it.each([
    [5, 0, 0, 15],
    [4, 1, 0, 14],
    [4, 0, 1, 13],
    [2, 2, 1, 11],
    [0, 0, 0, 0], // Zero EX score
  ])(
    'calcExScore(%i, %i, %i) returns %i',
    (marvelousAndOk, perfect, great, expected) => {
      expect(calcExScore(marvelousAndOk, perfect, great)).toBe(expected)
    },
  )

  it.each([
    [
      377,
      11,
      1000000,
      [
        {
          marvelous: 377,
          perfect: 0,
          great: 0,
          good: 0,
          ok: 11,
          miss: 0,
          exScore: 1164,
        },
      ],
    ],
    [
      377,
      11,
      998700,
      [
        {
          marvelous: 351,
          perfect: 25,
          great: 1,
          good: 0,
          ok: 11,
          miss: 0,
          exScore: 1137,
        },
        {
          marvelous: 247,
          perfect: 130,
          great: 0,
          good: 0,
          ok: 11,
          miss: 0,
          exScore: 1034,
        },
      ],
    ],
    [
      120,
      8,
      992180,
      [
        {
          marvelous: 119,
          perfect: 0,
          great: 0,
          good: 0,
          ok: 8,
          miss: 1,
          exScore: 381,
        },
      ],
    ],
  ])(
    'inferJudgementCounts(%i, %i, %i) returns %j',
    (normalNotes, okCount, normalScore, expected) => {
      const result = inferJudgementCounts(normalNotes, okCount, normalScore)
      expect(result).toEqual(expected)
      for (const r of result) {
        expect(r.marvelous + r.perfect + r.great + r.good).toBeLessThanOrEqual(
          normalNotes,
        )
        expect(r.ok).toBeLessThanOrEqual(okCount)
        expect(r.marvelous + r.perfect + r.great + r.good + r.ok + r.miss).toBe(
          normalNotes + okCount,
        )
        expect(
          calcNormalScore(
            normalNotes + okCount,
            r.marvelous + r.ok,
            r.perfect,
            r.great,
            r.good,
          ),
        ).toBe(normalScore)
        expect(r.exScore).toBe(
          calcExScore(r.marvelous + r.ok, r.perfect, r.great),
        )
      }
    },
  )

  it('aggregates candidates by EX score ranges', () => {
    const aggregated = aggregateCandidatesByExScore([
      {
        marvelous: 5,
        perfect: 1,
        great: 0,
        good: 0,
        ok: 0,
        miss: 0,
        exScore: 17,
      },
      {
        marvelous: 4,
        perfect: 2,
        great: 0,
        good: 0,
        ok: 0,
        miss: 0,
        exScore: 17,
      },
      {
        marvelous: 6,
        perfect: 0,
        great: 0,
        good: 0,
        ok: 0,
        miss: 0,
        exScore: 18,
      },
    ])

    expect(aggregated).toEqual([
      {
        exScore: 18,
        marvelousMin: 6,
        marvelousMax: 6,
        perfectMin: 0,
        perfectMax: 0,
        greatMin: 0,
        greatMax: 0,
        goodMin: 0,
        goodMax: 0,
        okMin: 0,
        okMax: 0,
        missMin: 0,
        missMax: 0,
        patterns: 1,
      },
      {
        exScore: 17,
        marvelousMin: 4,
        marvelousMax: 5,
        perfectMin: 1,
        perfectMax: 2,
        greatMin: 0,
        greatMax: 0,
        goodMin: 0,
        goodMax: 0,
        okMin: 0,
        okMax: 0,
        missMin: 0,
        missMax: 0,
        patterns: 2,
      },
    ])
  })
})
