import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

// Doc formatter: prettier (format) -> markdownlint-cli2 (structure) -> textlint
// (prose), each in auto-fix mode. prettier runs first so the later tools fix on
// top of formatted files. It only writes fixes; it does not report or fail on
// leftover issues — run the check scripts (lint:text etc.) for that.
const repoRoot = resolve(import.meta.dirname, '..');
const bin = (name) => join(repoRoot, 'node_modules', '.bin', name);

// Targets are directories (default: the blog content dir). Markdown globs are
// derived from them for the markdown-only tool.
const targets = process.argv.slice(2);
const paths = targets.length > 0 ? targets : ['_posts'];
const mdGlobs = paths.map((path) => `${path}/**/*.md`);

const steps = [
  {
    command: bin('prettier'),
    args: ['--write', '--log-level', 'warn', ...paths],
  },
  { command: bin('markdownlint-cli2'), args: ['--fix', ...mdGlobs] },
  { command: bin('textlint-config'), args: ['--fix', ...paths] },
];

for (const { command, args } of steps) {
  spawnSync(command, args, { stdio: 'inherit', cwd: repoRoot });
}
