/**
 * lint-staged configuration for Whiteboard.
 *
 * - JS/TS files (staged only): ESLint with --fix. Safe fixes (e.g. prefer-const)
 *   are applied and re-staged automatically; unfixable errors block the commit.
 * - JSON files: parsed to catch broken JSON before it is committed.
 * - Whole-project TypeScript checking is NOT done per-file here (tsconfig
 *   includes src/, api/ and lib/, so tsc cannot take filenames). It runs once
 *   per commit in the pre-commit hook via `npm run typecheck`.
 *
 * Staged .css and .md files have no safe associated check and are ignored.
 */
export default {
  '*.{ts,tsx,js,jsx}': (files) => [`eslint --fix ${files.join(' ')}`],
  '**/*.json': (files) =>
    files.map(
      (file) =>
        `node -e "JSON.parse(require('fs').readFileSync('${file}', 'utf8'))"`,
    ),
};
