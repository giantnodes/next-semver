import type { Options } from 'tsup'

import { defineConfig } from 'tsup'

const config: Options = {
  clean: true,
  dts: false,
  format: ['cjs'],
  target: 'es2019',
  outDir: 'dist',
}

export { config }
export default defineConfig({ ...config })
