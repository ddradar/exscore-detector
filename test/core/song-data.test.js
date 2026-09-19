import { describe, expect, it } from 'vitest'

import {
  getTheoreticalMaxEx,
  normalizeSongs,
  toNonNegativeInteger,
} from '../../src/core/song-data.js'

describe('song data utilities', () => {
  it('normalizes songs into validated objects', () => {
    const songs = normalizeSongs([
      { title: 'Song A (EXP)', notes: 100, freezes: 10, shocks: 0 },
    ])

    expect(songs).toEqual([
      { title: 'Song A (EXP)', notes: 100, freezes: 10, shocks: 0 },
    ])
  })

  it('throws when title is empty', () => {
    expect(() =>
      normalizeSongs([{ title: '   ', notes: 10, freezes: 0, shocks: 0 }])
    ).toThrow(/title/)
  })

  it('converts valid integer and rejects invalid values', () => {
    expect(toNonNegativeInteger('42', 'value')).toBe(42)
    expect(() => toNonNegativeInteger(-1, 'value')).toThrow(/non-negative/)
  })

  it('calculates theoretical max EX', () => {
    expect(getTheoreticalMaxEx({ notes: 100, freezes: 10, shocks: 5 })).toBe(345)
  })
})
