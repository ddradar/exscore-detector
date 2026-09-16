function calcNormalScore(totalNotes, marvelousAndOk, perfect, great, good) {
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

function inferExScore(totalNotes, judgement) {
  const total = Number(totalNotes)
  const { perfect = 0, great = 0, good = 0 } = judgement
  return total * 3 - perfect - great * 2 - good * 3
}

function inferJudgementCounts(normalNotes, okCount, normalScore, fullComboType) {
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
          if (type === 'FC' && perfect === 0 && great === 0 && good === 0)
            continue

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

const songSelect = document.querySelector('#song-select')
const scoreInput = document.querySelector('#normal-score-input')
const form = document.querySelector('#detector-form')
const status = document.querySelector('#status')
const songMeta = document.querySelector('#song-meta')
const resultContainer = document.querySelector('#result-container')
const chartMeta = document.querySelector('#chart-meta')

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

function getTheoreticalMaxEx(song) {
  return (Number(song.notes) + Number(song.freezes) + Number(song.shocks)) * 3
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

function toNonNegativeInteger(value, keyName) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new TypeError(`${keyName} must be a non-negative integer: ${value}`)
  }
  return number
}

function normalizeSongs(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('songs.json に有効な楽曲データがありません。')
  }

  return rawList.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError(`songs.json[${index}] must be an object`)
    }

    const title = String(entry.title ?? '').trim()
    if (!title) {
      throw new TypeError(`songs.json[${index}].title must be a non-empty string`)
    }

    const notes = toNonNegativeInteger(entry.notes, `songs.json[${index}].notes`)
    const freezes = toNonNegativeInteger(
      entry.freezes,
      `songs.json[${index}].freezes`
    )
    const shocks = toNonNegativeInteger(
      entry.shocks,
      `songs.json[${index}].shocks`
    )

    return {
      title,
      notes,
      freezes,
      shocks,
    }
  })
}

function formatRange(min, max) {
  return min === max ? String(min) : `${min}-${max}`
}

function aggregateCandidatesByExScore(candidates) {
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

async function loadSongs() {
  try {
    const response = await fetch('./songs.json', { cache: 'no-store' })
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

loadSongs()
