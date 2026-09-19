import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

export default defineConfig({
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
    },
    environment: 'happy-dom',
  },
})
