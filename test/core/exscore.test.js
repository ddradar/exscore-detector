import { describe, expect, it } from 'vitest'

import {
  aggregateCandidatesByExScore,
  calcNormalScore,
  inferExScore,
  inferJudgementCounts,
} from '../../src/core/exscore.js'

describe('exscore core logic', () => {
  it('calculates normal score for all-marvelous chart', () => {
    const result = calcNormalScore(100, 100, 0, 0, 0)
    expect(result).toBe(1000000)
  })

  it('infers EX score from judgement counts', () => {
    const result = inferExScore(100, { perfect: 1, great: 2, good: 3 })
    expect(result).toBe(286)
  })

  it('returns MFC candidate with max EX score', () => {
    const result = inferJudgementCounts(4, 1, 1000000, 'MFC')
    expect(result).toEqual([
      {
        marvelous: 5,
        perfect: 0,
        great: 0,
        good: 0,
        ok: 1,
        miss: 0,
        exScore: 15,
      },
    ])
  })

  it('throws for invalid full combo type', () => {
    expect(() => inferJudgementCounts(100, 0, 999000, 'AAA')).toThrow(
      /fullComboType/
    )
  })

  it('aggregates candidates by EX score ranges', () => {
    const aggregated = aggregateCandidatesByExScore([
      { marvelous: 5, perfect: 1, great: 0, good: 0, ok: 0, miss: 0, exScore: 17 },
      { marvelous: 4, perfect: 2, great: 0, good: 0, ok: 0, miss: 0, exScore: 17 },
      { marvelous: 6, perfect: 0, great: 0, good: 0, ok: 0, miss: 0, exScore: 18 },
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
