import { beforeEach, describe, expect, it, vi } from 'vitest'

function createAppMarkup() {
  return `
    <main class="layout">
      <section class="panel form-panel">
        <form id="detector-form" class="detector-form">
          <label for="song-select">曲名</label>
          <select id="song-select" required></select>
          <p id="song-meta" class="song-meta"></p>
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

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('app UI', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = createAppMarkup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          title: 'Test Song (EXP)',
          notes: 1,
          freezes: 0,
          shocks: 0,
        },
      ],
    })
  })

  it('renders result table snapshot after submit', async () => {
    const { initApp } = await import('../../src/ui/app-ui.js')

    initApp()
    await flushPromises()

    const input = document.querySelector('#normal-score-input')
    const form = document.querySelector('#detector-form')

    input.value = '1000000'
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    const snapshotRoot = document.querySelector('#result-container')
    expect(snapshotRoot.innerHTML).toMatchSnapshot()

    expect(document.querySelector('#status').textContent).toContain('EX候補')
    expect(document.querySelector('#app-version').textContent).toBe('0.1.0')
  })
})
