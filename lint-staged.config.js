/**
 * lint-staged configuration for Whiteboard.
 *
 * This project has no formatter or per-file linter (no Prettier/ESLint),
 * so lint-staged deliberately performs safe checks only:
 *
 * - JSON files (package.json, tsconfig.json, lockfile, ...) are parsed to
 *   catch broken JSON before it is committed.
 * - TypeScript checking is NOT done here on a per-file basis: the project's
 *   tsconfig includes src/, api/ and lib/, so `tsc --noEmit` cannot be given
 *   individual filenames. The full check runs in the pre-commit hook via
 *   `npm run lint` (whole project, exactly once per commit).
 *
 * Staged .css and .md files have no safe associated check and are ignored.
 */
export default {
  '**/*.json': (files) =>
    files.map(
      (file) =>
        `node -e "JSON.parse(require('fs').readFileSync('${file}', 'utf8'))"`,
    ),
};
