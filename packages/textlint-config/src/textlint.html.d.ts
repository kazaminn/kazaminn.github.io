import type { TextlintKernelDescriptor } from '@textlint/kernel';
import type { TextlintConfigOptions } from './textlint.base.js';

export type { TextlintConfigOptions, TextlintStyle } from './textlint.base.js';

export declare function createHtmlConfig(
  options?: TextlintConfigOptions,
): TextlintKernelDescriptor;
