import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import {
  clearSongsDocument,
  loadSongsDocument,
  parseSongsDocumentText,
  saveSongsDocument,
  songsDocumentToEntries,
  validateSongsDocument,
} from '../../src/core/imported-song-data.js'

const sampleSongsText = readFileSync(
  join(process.cwd(), 'test', 'songs.json'),
  'utf-8'
)

describe('imported song data', () => {
  it('parses and validates the sample songs JSON', () => {
    const document = parseSongsDocumentText(sampleSongsText)

    expect(document.name).toBe('鉄心道 Act.3')
    expect(document.charts.length).toBeGreaterThan(0)
    expect(document.charts[0]).toEqual({
      name: 'ビビットストリーム',
      difficulty: 'EXPERT',
      level: 13,
      notes: 464,
      freezes: 18,
      shocks: 0,
    })
  })

  it('converts document charts into selectable entries', () => {
    const document = parseSongsDocumentText(sampleSongsText)
    const entries = songsDocumentToEntries(document)

    expect(entries[0]).toEqual({
      songName: 'ビビットストリーム',
      difficulty: 'EXPERT',
      level: 13,
      notes: 464,
      freezes: 18,
      shocks: 0,
    })
  })

  it('saves and loads validated JSON with storage', () => {
    localStorage.clear()
    const document = parseSongsDocumentText(sampleSongsText)

    saveSongsDocument(document, localStorage)
    const loaded = loadSongsDocument(localStorage)

    expect(loaded).toEqual(document)
  })

  it('clears saved JSON from storage', () => {
    const document = parseSongsDocumentText(sampleSongsText)
    saveSongsDocument(document, localStorage)
    clearSongsDocument(localStorage)

    expect(loadSongsDocument(localStorage)).toBeNull()
  })

  it('rejects invalid schema values', () => {
    expect(() =>
      validateSongsDocument({
        name: 'x',
        charts: [{ name: 'A', difficulty: 'INVALID', level: 5, notes: 200 }],
      })
    ).toThrow(/difficulty/)
  })

  it('removes corrupted stored JSON', () => {
    localStorage.clear()
    localStorage.setItem('exscore-detector:imported-songs:v1', '{"name":1}')

    expect(() => loadSongsDocument(localStorage)).toThrow(
      /保存済みJSONの読み込みに失敗/
    )
    expect(
      localStorage.getItem('exscore-detector:imported-songs:v1')
    ).toBeNull()
  })
})
