import type {
  TextlintFixResult,
  TextlintKernelDescriptor,
  TextlintKernelRule,
  TextlintResult,
} from '@textlint/kernel';
import type { TextlintConfigOptions } from './textlint.base.js';

export type RunTextlintOptions = {
  /** Globs and the ignore file resolve against this. @default process.cwd() */
  cwd?: string;
  /** Options forwarded to the shared descriptor factory. */
  config?: TextlintConfigOptions;
  /** Extra rules concatenated onto the descriptor. */
  rules?: TextlintKernelRule[];
  /** Prebuilt descriptor; overrides `config`/`rules`. @default createHtmlConfig(config) */
  descriptor?: TextlintKernelDescriptor;
  /** Defaults to one glob per extension the descriptor's plugins support. */
  globs?: string[];
  /** Path to an ignore file. @default the config package's bundled `.textlintignore` */
  ignoreFilePath?: string;
  /** @default 'stylish' */
  formatterName?: string;
  /** Auto-fix files on disk instead of reporting. @default false */
  fix?: boolean;
};

export type RunTextlintResult = {
  results: TextlintResult[] | TextlintFixResult[];
  /** Formatted report, ready to print (empty in `fix` mode). */
  output: string;
  /** Total messages across all files (0 in `fix` mode). */
  problemCount: number;
};

export declare function runTextlint(
  options?: RunTextlintOptions,
): Promise<RunTextlintResult>;
