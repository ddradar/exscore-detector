import {
  aggregateCandidatesByExScore,
  formatRange,
  inferJudgementCounts,
} from '../core/exscore.js'
import { getTheoreticalMaxEx, normalizeSongs } from '../core/song-data.js'

const songSelect = document.querySelector('#song-select')
const scoreInput = document.querySelector('#normal-score-input')
const form = document.querySelector('#detector-form')
const status = document.querySelector('#status')
const songMeta = document.querySelector('#song-meta')
const resultContainer = document.querySelector('#result-container')
const chartMeta = document.querySelector('#chart-meta')
const appVersion = document.querySelector('#app-version')

let songEntries = []

function setStatus(message, kind = 'default') {
  status.textContent = message
  status.className = `status ${kind}`
}

function createOption(value, text) {
  const option = document.createElement('option')
  option.value = value
  option.textContent = text
  return option
}

function getSelectedSong() {
  const index = Number(songSelect.value)
  return songEntries[index] ?? null
}

function renderSelectedSongMeta() {
  const song = getSelectedSong()
  if (!song) {
    songMeta.textContent = ''
    return
  }

  const maxEx = getTheoreticalMaxEx(song)
  songMeta.textContent = `Notes: ${song.notes}/${song.freezes}/${song.shocks}, MAX: ${maxEx}`
}

function populateSongOptions() {
  songSelect.innerHTML = ''
  songEntries.forEach((entry, index) => {
    songSelect.appendChild(createOption(String(index), entry.title))
  })

  songSelect.value = '0'
  renderSelectedSongMeta()
}

function renderResultTable(candidates) {
  const table = document.createElement('table')
  table.className = 'result-table'

  const maxExScore = Math.max(...candidates.map((candidate) => candidate.exScore))

  const headers = ['#', 'MARVELOUS', 'PERFECT', 'GREAT', 'GOOD', 'OK', 'MISS', 'EX']

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  headers.forEach((header) => {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)

  const tbody = document.createElement('tbody')

  candidates.forEach((item, index) => {
    const row = document.createElement('tr')
    if (item.exScore === maxExScore) {
      row.classList.add('best-pattern')
    }

    const cells = [
      index + 1,
      formatRange(item.marvelousMin, item.marvelousMax),
      formatRange(item.perfectMin, item.perfectMax),
      formatRange(item.greatMin, item.greatMax),
      formatRange(item.goodMin, item.goodMax),
      formatRange(item.okMin, item.okMax),
      formatRange(item.missMin, item.missMax),
      item.exScore,
    ]

    cells.forEach((cell) => {
      const td = document.createElement('td')
      td.textContent = String(cell)
      row.appendChild(td)
    })

    tbody.appendChild(row)
  })

  table.appendChild(thead)
  table.appendChild(tbody)
  return table
}

function clearResult() {
  resultContainer.innerHTML = ''
}

function bindEvents() {
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    clearResult()

    const song = getSelectedSong()
    if (!song) {
      setStatus('曲が選択されていません。', 'error')
      return
    }

    const normalScore = Number(scoreInput.value)
    if (!Number.isInteger(normalScore) || normalScore < 0 || normalScore > 1000000) {
      setStatus('通常スコアは 0 から 1000000 の整数で入力してください。', 'error')
      return
    }

    try {
      const notes = Number(song.notes)
      const okCount = Number(song.freezes) + Number(song.shocks)
      const candidates = inferJudgementCounts(notes, okCount, normalScore, null)
      const exAggregates = aggregateCandidatesByExScore(candidates)

      chartMeta.textContent = `${song.title} / Normal Score: ${normalScore}`
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
    renderSelectedSongMeta()
    clearResult()
    setStatus('通常スコアを入力して計算してください。')
  })
}

async function loadSongs() {
  try {
    const response = await fetch('/songs.json', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`songs.json の読み込みに失敗しました (${response.status})`)
    }

    const data = await response.json()
    songEntries = normalizeSongs(data)
    populateSongOptions()
    setStatus('通常スコアを入力して計算してください。')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), 'error')
  }
}

export function initApp() {
  appVersion.textContent = import.meta.env.PACKAGE_VERSION
  bindEvents()
  loadSongs()
}
