# `@kazamitte/textlint-config`

Shared [textlint](https://textlint.org/) presets for Japanese prose (Markdown/plain text/HTML) in the design-system monorepo, reusable across other projects.

```js
// textlint.config.mjs (project root)
import { createHtmlConfig } from '@kazamitte/textlint-config/html';

export default createHtmlConfig();
```

```jsonc
// package.json
{
  "scripts": {
    "lint:text": "textlint-config _posts", // paths/globs optional; omit to lint everything
  },
}
```

Entry points: `./base`, `./html` (factories that return a descriptor), and `./runner` (the lint engine). The package also ships a `textlint-config` bin.

---

## Why a config package (and a bin) instead of `.textlintrc`

textlint's own config loader resolves rules/presets **by name from the consumer's `node_modules`** and can't read an ESM config file. Under pnpm the preset packages are nested inside this config package, so name resolution from the root fails, and `textlint.config.mjs` won't load through the standard CLI.

So we use textlint's **module API**: the factories `import` the preset modules directly and hand a fully-built `TextlintKernelDescriptor` to `createLinter`. The `textlint-config` bin is a thin wrapper that loads your `textlint.config.mjs`, builds the linter, and reports — giving the same feel as `eslint.config.js` + `eslint`.

| ESLint                | this package          |
| --------------------- | --------------------- |
| shared config factory | `./base` / `./html`   |
| `eslint` CLI          | `textlint-config` bin |
| `eslint.config.js`    | `textlint.config.mjs` |

---

## Presets

- **base** — Japanese prose rules for Markdown/plain text (`@textlint/markdown` + `@textlint/text` plugins).
- **html** — base + `textlint-plugin-html`, so `.html` is linted with the same rules (base still covers `.md`/`.txt`).

### Options (`createBaseConfig` / `createHtmlConfig`)

| option      | type                                                  | default                  | meaning                                        |
| ----------- | ----------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| `style`     | `'japanese' \| 'ja-technical-writing' \| 'jtf-style'` | `'ja-technical-writing'` | Prose style guide preset (pick **one**).       |
| `aiWriting` | `boolean`                                             | `true`                   | Add `preset-ai-writing`.                       |
| `spacing`   | `boolean`                                             | `true`                   | Add `preset-ja-spacing`.                       |
| `rules`     | `Record<string, boolean \| object>`                   | `{}`                     | Override / disable individual rules by ruleId. |

The three `style` presets are overlapping style guides — choose one, don't stack them.

---

## Config file

`textlint.config.mjs` at the project root `export default`s a descriptor:

```js
import { createHtmlConfig } from '@kazamitte/textlint-config/html';

export default createHtmlConfig({
  style: 'ja-technical-writing',
  aiWriting: true,
  spacing: true,
});
```

To combine several descriptors, export an **array** — they merge left-to-right:

```js
import { createBaseConfig } from '@kazamitte/textlint-config/base';
import { createHtmlConfig } from '@kazamitte/textlint-config/html';

export default [createHtmlConfig(), createBaseConfig({ style: 'jtf-style' })];
```

> Merge only **adds** rules for new ruleIds (the first descriptor wins on duplicates). To change an existing rule, use `rules` below — not a second descriptor.

---

## Overriding rules

Pass a `rules` map keyed by the **full ruleId** — the same string textlint prints in its report, e.g. `preset-ja-technical-writing/max-ten`. `false` disables a rule; an object replaces its options; `true` re-enables with defaults.

```js
import { createHtmlConfig } from '@kazamitte/textlint-config/html';

export default createHtmlConfig({
  rules: {
    // disable a rule entirely
    'preset-ja-technical-writing/no-exclamation-question-mark': false,
    // relax a rule's options
    'preset-ja-technical-writing/sentence-length': { max: 120 },
    'preset-ja-technical-writing/max-ten': { max: 5 },
  },
});
```

Find the ruleId to target by running the linter — every message ends with its ruleId:

```
  1:28  error  一つの文で"、"を4つ以上使用しています  preset-ja-technical-writing/max-ten
```

The familiar `.textlintrc`-style **nested** preset map works too, and a whole-preset key toggles every rule in it:

```js
export default createHtmlConfig({
  rules: {
    // nested form — same as 'preset-ja-technical-writing/max-comma': { max: 3 }
    'preset-ja-technical-writing': {
      'max-comma': { max: 3 },
    },
    // disable an entire preset
    'preset-ai-writing': false,
  },
});
```

`concat`/array-merge cannot override preset rules (a duplicate ruleId keeps the first definition), so overrides are applied here, at descriptor-build time.

### Adding a custom rule

An override map only tunes existing rules. To add your own rule module, `concat` a descriptor (or put it in the exported array):

```js
import { TextlintKernelDescriptor } from '@textlint/kernel';
import { createHtmlConfig } from '@kazamitte/textlint-config/html';
import myRule from './my-textlint-rule.js';

export default createHtmlConfig().concat(
  new TextlintKernelDescriptor({
    rules: [{ ruleId: 'my-rule', rule: myRule, options: true }],
    filterRules: [],
    plugins: [],
  }),
);
```

---

## Ignoring files

Build output is ignored by default via a `.textlintignore` shipped **with this package** (`**/dist/**`, `**/.next/**`, `**/out/**`, …); `node_modules` and `.git` are always ignored by textlint itself. To use your own ignore file, pass its path through the runner (`ignoreFilePath`).

---

## CLI

```
textlint-config [--config <path>] [--fix] [globs...]
```

- `--config`, `-c` — config file (default `textlint.config.mjs` in cwd). Falls back to `createHtmlConfig()` when none exists.
- `--fix` — auto-fix files on disk instead of reporting (formatter mode); always exits `0`.
- positional args — files or globs to lint; when omitted, one glob per extension the descriptor's plugins support.
- exit code — `1` if any problems, else `0` (always `0` with `--fix`).

---

## Programmatic use

`./runner` exposes the engine used by the bin:

```js
import { runTextlint } from '@kazamitte/textlint-config/runner';

const { output, problemCount } = await runTextlint({
  cwd: process.cwd(),
  config: { style: 'jtf-style' }, // forwarded to the descriptor factory
  rules: [], // extra kernel rules to concat
  // descriptor, globs, ignoreFilePath, formatterName also accepted
});

if (output) process.stdout.write(output);
process.exit(problemCount > 0 ? 1 : 0);
```

Types are published as declaration files alongside each entry point.
