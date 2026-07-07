import { TextlintKernelDescriptor } from '@textlint/kernel';
import { moduleInterop } from '@textlint/module-interop';
import htmlPlugin from 'textlint-plugin-html';
import { createBaseConfig } from './textlint.base.js';

// Base plus the HTML processor plugin, so `.html` is linted with the same
// rules; base still covers `.md` / `.txt`.
export function createHtmlConfig(options = {}) {
  return createBaseConfig(options).concat(
    new TextlintKernelDescriptor({
      rules: [],
      filterRules: [],
      plugins: [{ pluginId: 'html', plugin: moduleInterop(htmlPlugin) }],
    }),
  );
}
