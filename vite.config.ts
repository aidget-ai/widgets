import { defineConfig } from 'vite-plus';

// Distributed widget bytes are reviewed and versioned separately from repository tooling.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/scripts/**/*.test.ts'],
  },
  fmt: {
    singleQuote: true,
    sortImports: {},
    printWidth: 100,
    ignorePatterns: ['schemas/**', 'registry.json'],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { curly: 'error', 'vite-plus/prefer-vite-plus-imports': 'error' },
  },
});
