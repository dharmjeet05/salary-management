import { defineConfig } from 'eslint/config'
import { base } from '@salary/config/eslint/base'

export default defineConfig(base, {
  languageOptions: {
    parserOptions: { tsconfigRootDir: import.meta.dirname },
  },
})
