#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runTextlint } from '../src/textlint.runner.js';

// Thin CLI in the eslint spirit: load a declarative `textlint.config.mjs` from
// cwd (overridable with --config) and lint, or auto-fix on disk with --fix. The
// config's default export is a descriptor, or an array of descriptors merged
// left-to-right (flat-config feel).
const argv = process.argv.slice(2);
let configPath = 'textlint.config.mjs';
let fix = false;
const globs = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--config' || argv[i] === '-c') {
    configPath = argv[(i += 1)];
  } else if (argv[i] === '--fix') {
    fix = true;
  } else {
    globs.push(argv[i]);
  }
}

const cwd = process.cwd();

const loadDescriptor = async () => {
  const url = pathToFileURL(resolve(cwd, configPath)).href;
  const loaded = await import(url).catch((error) => {
    // Zero-config: fall back to the package default when no config file exists.
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return undefined;
    throw error;
  });
  const exported = loaded?.default;
  if (Array.isArray(exported)) {
    return exported.length > 0
      ? exported.reduce((merged, next) => merged.concat(next))
      : undefined;
  }
  return exported;
};

const descriptor = await loadDescriptor();

const { output, problemCount } = await runTextlint({
  cwd,
  fix,
  ...(descriptor ? { descriptor } : {}),
  ...(globs.length > 0 ? { globs } : {}),
});

if (output.trim() !== '') {
  process.stdout.write(output);
}
// --fix is a formatter: it writes fixes and always succeeds.
process.exit(!fix && problemCount > 0 ? 1 : 0);
