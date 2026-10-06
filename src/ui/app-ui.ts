import {
  clearSongsDocument,
  loadSongsDocument,
  parseSongsFile,
  saveSongsDocument,
  songsDocumentToEntries,
} from '../core/imported-song-data.js'
import {
  aggregateCandidatesByExScore,
  calcExScore,
  inferJudgementCounts,
} from '../core/score.js'

const songSelect = document.querySelector('#song-select') as HTMLSelectElement
const scoreInput = document.querySelector(
  '#normal-score-input'
) as HTMLInputElement
const form = document.querySelector('#detector-form') as HTMLFormElement
const status = document.querySelector('#status') as HTMLElement
const songMeta = document.querySelector('#song-meta') as HTMLElement
const resultContainer = document.querySelector(
  '#result-container'
) as HTMLElement
const chartMeta = document.querySelector('#chart-meta') as HTMLElement
const appVersion = document.querySelector('#app-version') as HTMLElement
const jsonDropZone = document.querySelector('#json-drop-zone') as HTMLElement
const uploadUi = document.querySelector('#upload-ui') as HTMLElement | null
const jsonFileInput = document.querySelector(
  '#json-file-input'
) as HTMLInputElement
const jsonClearButton = document.querySelector(
  '#json-clear-button'
) as HTMLButtonElement
const importedJsonName = document.querySelector(
  '#imported-json-name'
) as HTMLElement
const manualNotesInput = document.querySelector(
  '#manual-notes-input'
) as HTMLInputElement
const manualFreezesInput = document.querySelector(
  '#manual-freezes-input'
) as HTMLInputElement
const manualShocksInput = document.querySelector(
  '#manual-shocks-input'
) as HTMLInputElement
const manualClearButton = document.querySelector(
  '#manual-clear-button'
) as HTMLButtonElement

type SongEntry = ReturnType<typeof songsDocumentToEntries>[number]
type ExAggregate = ReturnType<typeof aggregateCandidatesByExScore>[number]
type JudgementRange = ExAggregate['marvelous']

let songEntries: SongEntry[] = []

function formatRange(min: number, max: number) {
  return min === max ? String(min) : `${min}-${max}`
}

function setStatus(message: string | null, kind = 'default') {
  status.textContent = message
  status.className = `status ${kind}`
}

function createOption(value: string, text: string, disabled = false) {
  const option = document.createElement('option')
  option.value = value
  option.textContent = text
  option.disabled = disabled
  return option
}

function getSelectedSong() {
  const index = Number(songSelect.value)
  return songEntries[index] ?? null
}

function setManualInputs(notes: number, freezes: number, shocks: number) {
  manualNotesInput.value = String(notes)
  manualFreezesInput.value = String(freezes)
  manualShocksInput.value = String(shocks)
}

function clearManualInputs() {
  manualNotesInput.value = ''
  manualFreezesInput.value = ''
  manualShocksInput.value = ''
}

function renderSelectedSongMeta() {
  const song = getSelectedSong()
  if (!song) {
    songMeta.textContent = ''
    return
  }

  const maxEx = calcExScore(song.notes + song.freezes + song.shocks, 0, 0)
  songMeta.textContent =
    `${song.difficulty} ${song.level} / ` +
    `Notes: ${song.notes}/${song.freezes}/${song.shocks}, MAX: ${maxEx}`
}

function resetSongSelect() {
  songSelect.innerHTML = ''
  songSelect.appendChild(
    createOption('', '譜面を選択してください（または直接入力）', true)
  )
  songSelect.value = ''
}

function populateSongOptions() {
  resetSongSelect()
  songEntries.forEach((entry, index) => {
    songSelect.appendChild(createOption(String(index), entry.songName))
  })
}

function setUploadVisibility(hasImportedSongs: boolean) {
  if (uploadUi) {
    uploadUi.hidden = hasImportedSongs
    uploadUi.classList.toggle('is-hidden', hasImportedSongs)
  } else {
    jsonDropZone.hidden = hasImportedSongs
    jsonDropZone.classList.toggle('is-hidden', hasImportedSongs)
    const importActions = jsonFileInput.closest(
      '.import-actions'
    ) as HTMLElement | null
    if (importActions) {
      importActions.hidden = hasImportedSongs
      importActions.classList.toggle('is-hidden', hasImportedSongs)
    } else {
      jsonFileInput.hidden = hasImportedSongs
      jsonFileInput.classList.toggle('is-hidden', hasImportedSongs)
    }
  }
  jsonClearButton.hidden = !hasImportedSongs
}

function setImportedJsonName(name: string | null) {
  if (name === null || name.trim() === '') {
    importedJsonName.textContent = ''
    importedJsonName.hidden = true
    return
  }

  importedJsonName.textContent = `name: ${name}`
  importedJsonName.hidden = false
}

function renderResultTable(candidates: ExAggregate[]) {
  const table = document.createElement('table')
  table.className = 'result-table'

  const maxExScore = Math.max(...candidates.map(candidate => candidate.exScore))
  const headers = [
    '#',
    'MARVELOUS',
    'PERFECT',
    'GREAT',
    'GOOD',
    'OK',
    'MISS',
    'EX',
  ]

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  headers.forEach(header => {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)

  const tbody = document.createElement('tbody')
  candidates.forEach(
    (
      item: {
        exScore: number
        marvelous: JudgementRange
        perfect: JudgementRange
        great: JudgementRange
        good: JudgementRange
        ok: JudgementRange
        miss: JudgementRange
      },
      index: number
    ) => {
      const row = document.createElement('tr')
      if (item.exScore === maxExScore) {
        row.classList.add('best-pattern')
      }

      const cells = [
        index + 1,
        formatRange(item.marvelous.min, item.marvelous.max),
        formatRange(item.perfect.min, item.perfect.max),
        formatRange(item.great.min, item.great.max),
        formatRange(item.good.min, item.good.max),
        formatRange(item.ok.min, item.ok.max),
        formatRange(item.miss.min, item.miss.max),
        item.exScore,
      ]

      cells.forEach(cell => {
        const td = document.createElement('td')
        td.textContent = String(cell)
        row.appendChild(td)
      })

      tbody.appendChild(row)
    }
  )

  table.append(thead, tbody)
  return table
}

function clearResult() {
  resultContainer.innerHTML = ''
}

function validateManualInput() {
  const notes = Number(manualNotesInput.value)
  const freezes = Number(manualFreezesInput.value || '0')
  const shocks = Number(manualShocksInput.value || '0')

  if (!Number.isInteger(notes) || notes <= 0) {
    throw new TypeError('ノート数は 1 以上の整数で入力してください。')
  }

  if (!Number.isInteger(freezes) || freezes < 0) {
    throw new TypeError('フリーズアロー数は 0 以上の整数で入力してください。')
  }

  if (!Number.isInteger(shocks) || shocks < 0) {
    throw new TypeError('ショックアロー数は 0 以上の整数で入力してください。')
  }

  return { notes, freezes, shocks }
}

async function applyImportedFile(file: File) {
  const document = await parseSongsFile(file)
  songEntries = songsDocumentToEntries(document)
  populateSongOptions()
  setUploadVisibility(true)
  setImportedJsonName(document.name)
  saveSongsDocument(document, localStorage)
  setStatus(
    `${document.name} を読み込みました。譜面を選択すると入力欄に反映されます。`,
    'success'
  )
}

function clearImportedSongs() {
  clearSongsDocument(localStorage)
  songEntries = []
  resetSongSelect()
  setUploadVisibility(false)
  setImportedJsonName(null)
  songMeta.textContent = ''
  clearResult()
  setStatus('取り込み済みJSONをクリアしました。', 'success')
}

function bindDropEvents() {
  const setDragActive = (active: boolean) => {
    jsonDropZone.classList.toggle('active', active)
  }

  ;['dragenter', 'dragover'].forEach(eventName => {
    jsonDropZone.addEventListener(eventName, (event: DragEvent) => {
      event.preventDefault()
      setDragActive(true)
    })
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    jsonDropZone.addEventListener(eventName, (event: DragEvent) => {
      event.preventDefault()
      setDragActive(false)
    })
  })

  jsonDropZone.addEventListener('drop', (event: DragEvent) => {
    const file = event.dataTransfer?.files.item(0)
    if (!file) {
      setStatus('JSONファイルをドロップしてください。', 'error')
      return
    }

    applyImportedFile(file).catch(error => {
      setStatus(error instanceof Error ? error.message : String(error), 'error')
    })
  })
}

function bindEvents() {
  form.addEventListener('submit', event => {
    event.preventDefault()
    clearResult()

    const normalScore = Number(scoreInput.value)
    if (
      !Number.isInteger(normalScore) ||
      normalScore < 0 ||
      normalScore > 1000000
    ) {
      setStatus(
        '通常スコアは 0 から 1000000 の整数で入力してください。',
        'error'
      )
      return
    }

    try {
      const chart = validateManualInput()
      const okCount = chart.freezes + chart.shocks
      const candidates = inferJudgementCounts(chart.notes, okCount, normalScore)
      const exAggregates = aggregateCandidatesByExScore(candidates)
      const selectedSong = getSelectedSong()
      const chartTitle = selectedSong?.songName ?? '直接入力'

      chartMeta.textContent = `${chartTitle} / Normal Score: ${normalScore}`
      setStatus(
        `${exAggregates.length} 件のEX候補を表示（${candidates.length} パターンを集約）`,
        'success'
      )
      resultContainer.appendChild(renderResultTable(exAggregates))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error), 'error')
    }
  })

  songSelect.addEventListener('change', () => {
    const song = getSelectedSong()
    if (song) {
      setManualInputs(song.notes, song.freezes, song.shocks)
    }
    renderSelectedSongMeta()
    clearResult()
    setStatus('通常スコアを入力して計算してください。')
  })

  manualClearButton.addEventListener('click', () => {
    clearManualInputs()
    clearResult()
    setStatus('譜面情報の入力欄をクリアしました。')
  })

  jsonClearButton.addEventListener('click', clearImportedSongs)

  jsonFileInput.addEventListener('change', event => {
    const target = event.currentTarget as HTMLInputElement
    const file = target.files?.item(0)
    if (!file) {
      return
    }

    applyImportedFile(file).catch(error => {
      setStatus(error instanceof Error ? error.message : String(error), 'error')
    })
  })
}

function loadStoredSongs() {
  const stored = loadSongsDocument(localStorage)
  if (stored === null) {
    resetSongSelect()
    setUploadVisibility(false)
    setImportedJsonName(null)
    setStatus(
      'JSONをインポートするか、譜面情報を直接入力して計算してください。'
    )
    return
  }

  songEntries = songsDocumentToEntries(stored)
  populateSongOptions()
  setUploadVisibility(true)
  setImportedJsonName(stored.name)
  setStatus(
    `保存済みJSON（${stored.name}）を読み込みました。譜面を選択すると入力欄に反映されます。`
  )
}

export function initApp() {
  const packageVersion =
    (
      import.meta as ImportMeta & {
        env?: { PACKAGE_VERSION?: string }
      }
    ).env?.PACKAGE_VERSION ?? 'unknown'

  appVersion.textContent = packageVersion
  bindEvents()
  bindDropEvents()

  try {
    loadStoredSongs()
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), 'error')
    resetSongSelect()
    setUploadVisibility(false)
    setImportedJsonName(null)
  }
}
