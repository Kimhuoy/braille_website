module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  rules: {
    // React 19 no longer checks propTypes at all, and this project never used them.
    'react/prop-types': 'off',
    // Quotes and apostrophes in page text render correctly; escaping ~100 Khmer/English
    // sentences would only make the copy harder to edit.
    'react/no-unescaped-entities': 'off',
    // Khmer text uses zero-width spaces on purpose (line breaking); still flag them in code.
    'no-irregular-whitespace': ['error', { skipJSXText: true, skipStrings: true, skipTemplates: true }],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
