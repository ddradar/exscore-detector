const DIFFICULTIES = [
  'BEGINNER',
  'BASIC',
  'DIFFICULT',
  'EXPERT',
  'CHALLENGE',
] as const

const STORAGE_KEY = 'exscore-detector:imported-songs:v1'

type Difficulty = (typeof DIFFICULTIES)[number]

interface ImportedChart {
  name: string
  difficulty: Difficulty
  level: number
  notes: number
  freezes: number
  shocks: number
}

interface ImportedSongsDocument {
  name: string
  charts: ImportedChart[]
}

interface SongEntry {
  songName: string
  difficulty: Difficulty
  level: number
  notes: number
  freezes: number
  shocks: number
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toInteger(
  value: unknown,
  path: string,
  options: { min?: number; max?: number; defaultValue?: number } = {}
) {
  if (value === undefined) {
    if (options.defaultValue === undefined) {
      throw new TypeError(`${path} is required`)
    }
    return options.defaultValue
  }

  const number = Number(value)
  if (!Number.isInteger(number)) {
    throw new TypeError(`${path} must be an integer: ${value}`)
  }

  if (options.min !== undefined && number < options.min) {
    throw new TypeError(`${path} must be >= ${options.min}: ${value}`)
  }

  if (options.max !== undefined && number > options.max) {
    throw new TypeError(`${path} must be <= ${options.max}: ${value}`)
  }

  return number
}

function toDifficulty(value: unknown, path: string): Difficulty {
  if (typeof value !== 'string' || !isDifficulty(value)) {
    throw new TypeError(`${path} must be one of ${DIFFICULTIES.join(', ')}`)
  }
  return value
}

function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.some(difficulty => difficulty === value)
}

function parseSongChart(entry: unknown, index: number): ImportedChart {
  if (!isObject(entry)) {
    throw new TypeError(`charts[${index}] must be an object`)
  }

  const name = String(entry.name ?? '').trim()
  if (!name) {
    throw new TypeError(`charts[${index}].name must be a non-empty string`)
  }

  return {
    name,
    difficulty: toDifficulty(entry.difficulty, `charts[${index}].difficulty`),
    level: toInteger(entry.level, `charts[${index}].level`, {
      min: 1,
      max: 20,
    }),
    notes: toInteger(entry.notes, `charts[${index}].notes`, { min: 1 }),
    freezes: toInteger(entry.freezes, `charts[${index}].freezes`, {
      min: 0,
      defaultValue: 0,
    }),
    shocks: toInteger(entry.shocks, `charts[${index}].shocks`, {
      min: 0,
      defaultValue: 0,
    }),
  }
}

export function validateSongsDocument(raw: unknown): ImportedSongsDocument {
  if (!isObject(raw)) {
    throw new TypeError('JSONのルートはオブジェクトである必要があります。')
  }

  const name = String(raw.name ?? '').trim()
  if (!name) {
    throw new TypeError('name は空でない文字列である必要があります。')
  }

  const rawCharts = raw.charts
  if (!Array.isArray(rawCharts) || rawCharts.length === 0) {
    throw new TypeError('charts は1件以上の配列である必要があります。')
  }

  return {
    name,
    charts: rawCharts.map((chart, index) => parseSongChart(chart, index)),
  }
}

export function parseSongsDocumentText(text: string): ImportedSongsDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`JSONのパースに失敗しました: ${reason}`)
  }
  return validateSongsDocument(parsed)
}

export function songsDocumentToEntries(
  document: ImportedSongsDocument
): SongEntry[] {
  return document.charts.map(chart => ({
    songName: chart.name,
    difficulty: chart.difficulty,
    level: chart.level,
    notes: chart.notes,
    freezes: chart.freezes,
    shocks: chart.shocks,
  }))
}

export function saveSongsDocument(
  document: ImportedSongsDocument,
  storage: Storage
) {
  storage.setItem(STORAGE_KEY, JSON.stringify(document))
}

export function clearSongsDocument(storage: Storage) {
  storage.removeItem(STORAGE_KEY)
}

export function loadSongsDocument(
  storage: Storage
): ImportedSongsDocument | null {
  const value = storage.getItem(STORAGE_KEY)
  if (value === null) {
    return null
  }

  try {
    return parseSongsDocumentText(value)
  } catch (error) {
    storage.removeItem(STORAGE_KEY)
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`保存済みJSONの読み込みに失敗しました: ${reason}`)
  }
}

export function parseSongsFile(file: File): Promise<ImportedSongsDocument> {
  return file.text().then(text => parseSongsDocumentText(text))
}
