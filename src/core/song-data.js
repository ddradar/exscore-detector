function toNonNegativeInteger(value, keyName) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new TypeError(`${keyName} must be a non-negative integer: ${value}`)
  }
  return number
}

export function normalizeSongs(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('songs.json に有効な楽曲データがありません。')
  }

  return rawList.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError(`songs.json[${index}] must be an object`)
    }

    const title = String(entry.title ?? '').trim()
    if (!title) {
      throw new TypeError(
        `songs.json[${index}].title must be a non-empty string`,
      )
    }

    const notes = toNonNegativeInteger(
      entry.notes,
      `songs.json[${index}].notes`,
    )
    const freezes = toNonNegativeInteger(
      entry.freezes,
      `songs.json[${index}].freezes`,
    )
    const shocks = toNonNegativeInteger(
      entry.shocks,
      `songs.json[${index}].shocks`,
    )

    return {
      title,
      notes,
      freezes,
      shocks,
    }
  })
}
