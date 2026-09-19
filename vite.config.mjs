import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

export default defineConfig({
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
})
