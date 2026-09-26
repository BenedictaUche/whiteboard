import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * ESLint flat config for Whiteboard.
 *
 * Gate policy (incremental adoption):
 * - react-hooks/rules-of-hooks: hard error — hook misuse causes real bugs.
 * - no-unused-vars / no-explicit-any / exhaustive-deps: warnings for now.
 *   The current codebase has ~20 of these; once they are cleaned up,
 *   promote them to "error" here (and consider --max-warnings=0 in CI).
 * - args/vars prefixed with "_" are intentionally unused (existing
 *   convention in this codebase, e.g. ResultsState's `_topic`).
 */
export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '.kilo/', '.vercel/'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
