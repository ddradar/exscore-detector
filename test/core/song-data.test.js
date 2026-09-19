import { describe, expect, it } from 'vitest'

import { normalizeSongs } from '../../src/core/song-data.js'

describe('song data utilities', () => {
  it('normalizes songs into validated objects', () => {
    const songs = normalizeSongs([
      { title: 'Song A (EXP)', notes: 100, freezes: 10, shocks: 0 },
    ])

    expect(songs).toEqual([
      { title: 'Song A (EXP)', notes: 100, freezes: 10, shocks: 0 },
    ])
  })

  it.each([
    [{}, /songs\.json に有効な楽曲データがありません。/],
    [[], /songs\.json に有効な楽曲データがありません。/],
    [[1], /songs\.json\[0\] must be an object/],
    [
      [{ notes: 10, freezes: 0, shocks: 0 }],
      /\.title must be a non-empty string/,
    ],
    [
      [{ title: '   ', notes: 10, freezes: 0, shocks: 0 }],
      /\.title must be a non-empty string/,
    ],
    [
      [{ title: 'Song A (EXP)', notes: -1, freezes: 0, shocks: 0 }],
      /\.notes must be a non-negative integer: -1/,
    ],
    [
      [{ title: 'Song A (EXP)', notes: 100, freezes: -1, shocks: 0 }],
      /\.freezes must be a non-negative integer: -1/,
    ],
    [
      [{ title: 'Song A (EXP)', notes: 100, freezes: 0, shocks: -1 }],
      /\.shocks must be a non-negative integer: -1/,
    ],
  ])('normalizeSongs(%j) throws "%s"', (songs, errorPattern) => {
    expect(() => normalizeSongs(songs)).toThrow(errorPattern)
  })
})
