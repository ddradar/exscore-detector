import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const STORAGE_KEY = 'exscore-detector:imported-songs:v1'

function createAppMarkup() {
  return `
    <main class="layout">
      <section class="panel form-panel">
        <form id="detector-form" class="detector-form">
          <fieldset class="source-fieldset">
            <div id="upload-ui">
              <div id="json-drop-zone"></div>
              <input id="json-file-input" type="file" />
            </div>
            <p id="imported-json-name" hidden></p>
            <button id="json-clear-button" type="button" hidden>取り込みJSONをクリア</button>
            <select id="song-select"></select>
            <p id="song-meta" class="song-meta"></p>
            <div id="manual-inputs">
              <input id="manual-notes-input" type="number" />
              <input id="manual-freezes-input" type="number" />
              <input id="manual-shocks-input" type="number" />
              <button id="manual-clear-button" type="button">入力クリア</button>
            </div>
          </fieldset>
          <label for="normal-score-input">通常スコア</label>
          <input id="normal-score-input" type="number" />
          <button type="submit">計算する</button>
        </form>
      </section>
      <section class="panel result-panel">
        <p id="chart-meta" class="meta"></p>
        <p id="status" class="status" aria-live="polite"></p>
        <div id="result-container"></div>
      </section>
    </main>
    <footer class="site-footer">
      <p>Version: <span id="app-version"></span></p>
    </footer>
  `
}

describe('app UI', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = createAppMarkup()
    localStorage.clear()
  })

  it('fills manual inputs when selecting a chart from dropdown', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: 'sample',
        charts: [
          {
            name: 'Song A',
            difficulty: 'EXPERT',
            level: 10,
            notes: 321,
            freezes: 12,
            shocks: 3,
          },
        ],
      })
    )
    const { initApp } = await import('../../src/ui/app-ui.js')

    initApp()

    const select = document.querySelector('#song-select') as HTMLSelectElement
    select.value = '0'
    select.dispatchEvent(new Event('change', { bubbles: true }))

    expect(
      (document.querySelector('#manual-notes-input') as HTMLInputElement).value
    ).toBe('321')
    expect(
      (document.querySelector('#manual-freezes-input') as HTMLInputElement)
        .value
    ).toBe('12')
    expect(
      (document.querySelector('#manual-shocks-input') as HTMLInputElement).value
    ).toBe('3')
    expect(select.options[1]?.text).toBe('Song A')
    expect(
      (document.querySelector('#song-meta') as HTMLParagraphElement).textContent
    ).toContain('EXPERT 10')
  })

  it('hides upload UI when imported JSON is loaded', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: 'sample',
        charts: [
          {
            name: 'Song A',
            difficulty: 'EXPERT',
            level: 10,
            notes: 321,
            freezes: 12,
            shocks: 3,
          },
        ],
      })
    )
    const { initApp } = await import('../../src/ui/app-ui.js')

    initApp()

    expect((document.querySelector('#upload-ui') as HTMLElement).hidden).toBe(
      true
    )
    expect(
      (document.querySelector('#json-clear-button') as HTMLButtonElement).hidden
    ).toBe(false)
    expect(
      (document.querySelector('#imported-json-name') as HTMLParagraphElement)
        .textContent
    ).toBe('name: sample')
    expect(
      (document.querySelector('#imported-json-name') as HTMLParagraphElement)
        .hidden
    ).toBe(false)
  })

  it('hides upload controls even when upload wrapper is missing', async () => {
    const wrapper = document.querySelector('#upload-ui') as HTMLElement
    const dropZone = document.querySelector('#json-drop-zone') as HTMLElement
    const fileInput = document.querySelector(
      '#json-file-input'
    ) as HTMLInputElement
    wrapper.replaceWith(dropZone, fileInput)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: 'sample',
        charts: [
          {
            name: 'Song A',
            difficulty: 'EXPERT',
            level: 10,
            notes: 321,
            freezes: 12,
            shocks: 3,
          },
        ],
      })
    )
    const { initApp } = await import('../../src/ui/app-ui.js')

    initApp()

    expect(
      (document.querySelector('#json-drop-zone') as HTMLElement).hidden
    ).toBe(true)
    expect(
      (
        document.querySelector('#json-file-input') as HTMLInputElement
      ).classList.contains('is-hidden')
    ).toBe(true)
  })

  it('clears manual inputs with clear button', async () => {
    const { initApp } = await import('../../src/ui/app-ui.js')
    initApp()

    const notesInput = document.querySelector(
      '#manual-notes-input'
    ) as HTMLInputElement
    const freezesInput = document.querySelector(
      '#manual-freezes-input'
    ) as HTMLInputElement
    const shocksInput = document.querySelector(
      '#manual-shocks-input'
    ) as HTMLInputElement
    const button = document.querySelector(
      '#manual-clear-button'
    ) as HTMLButtonElement

    notesInput.value = '100'
    freezesInput.value = '10'
    shocksInput.value = '1'
    button.click()

    expect(notesInput.value).toBe('')
    expect(freezesInput.value).toBe('')
    expect(shocksInput.value).toBe('')
  })

  it('clears imported JSON data with clear button', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: 'sample',
        charts: [
          {
            name: 'Song A',
            difficulty: 'EXPERT',
            level: 10,
            notes: 321,
            freezes: 12,
            shocks: 3,
          },
        ],
      })
    )
    const { initApp } = await import('../../src/ui/app-ui.js')
    initApp()

    ;(document.querySelector('#json-clear-button') as HTMLButtonElement).click()

    const select = document.querySelector('#song-select') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect((document.querySelector('#upload-ui') as HTMLElement).hidden).toBe(
      false
    )
    expect(
      (document.querySelector('#imported-json-name') as HTMLParagraphElement)
        .hidden
    ).toBe(true)
  })

  it('renders result table snapshot after submit', async () => {
    const { initApp } = await import('../../src/ui/app-ui.js')
    initApp()

    const notesInput = document.querySelector(
      '#manual-notes-input'
    ) as HTMLInputElement
    const freezesInput = document.querySelector(
      '#manual-freezes-input'
    ) as HTMLInputElement
    const shocksInput = document.querySelector(
      '#manual-shocks-input'
    ) as HTMLInputElement
    const scoreInput = document.querySelector(
      '#normal-score-input'
    ) as HTMLInputElement
    const form = document.querySelector('#detector-form') as HTMLFormElement

    notesInput.value = '1'
    freezesInput.value = '0'
    shocksInput.value = '0'
    scoreInput.value = '1000000'
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    const snapshotRoot = document.querySelector(
      '#result-container'
    ) as HTMLDivElement
    expect(snapshotRoot.innerHTML).toMatchSnapshot()
  })
})
