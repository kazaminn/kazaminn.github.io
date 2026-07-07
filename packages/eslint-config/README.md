# `@kazamitte/eslint-config`

Shared ESLint v9.x flat-config presets for the design-system monorepo, reused across other React / Next / Node projects.

```js
// eslint.config.js (project root)
import { reactConfig } from '@kazamitte/eslint-config/react';

export default reactConfig(import.meta.dirname);
```

Entry points: `./base`, `./node`, `./react`, `./next` — each a factory `xxxConfig(tsconfigRootDir)`. `node` / `react` / `next` extend `base`.

---

## Why

- Quality — catch bugs and hold a high bar across the codebase.
- Consistency — AI agents drift between prompts, so style is pinned in lint, not restated each time.
- Autofixable — rules are fixed automatically to reduce manual effort.

---

## Presets

- base — framework-agnostic core: type safety, style unification, banned syntax, plus a **Vitest** block for test files that relaxes the `no-unsafe-*` family (unavoidable around mocks/expect) and `no-console`.
- node — base + node globals + zod.
- react — base + react-hooks + jsx-a11y + zod + react-refresh, plus **Storybook** and **Playwright** blocks.
- next — base + react-hooks + jsx-a11y + zod + @next/next, plus App Router `func-style` relaxation and the same **Storybook** / **Playwright** blocks. No react-refresh (React-dev-server specific).

---

## Verifying applied rules

- `eslint --inspect-config` — visualize which config blocks apply where. Use the "Test matching with filepath" field in the UI to filter by a specific file.
- `eslint --print-config <file>` — dump the fully resolved rules (with values) for one file.

## Version notes

- ESLint v9 (EOL: 2026-08-06). v10 migration is a separate task.
- astro (planned) — base + eslint-plugin-astro.
