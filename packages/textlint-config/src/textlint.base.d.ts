import type {
  TextlintKernelDescriptor,
  TextlintRuleOptions,
} from '@textlint/kernel';

/** Prose style guide preset — pick exactly one. */
export type TextlintStyle = 'japanese' | 'ja-technical-writing' | 'jtf-style';

/**
 * Rule overrides. `false` disables, `true` keeps defaults, an object replaces
 * options. Two key styles are accepted:
 * - flat ruleId (as shown in lint output): `'preset-ja-technical-writing/max-ten'`
 * - textlintrc-style nested preset map: `'preset-ja-technical-writing': { 'max-ten': ... }`
 *
 * A whole-preset key (`'preset-ai-writing': false`) toggles every rule in it.
 */
export type TextlintRuleOverrides = Record<
  string,
  boolean | TextlintRuleOptions | Record<string, boolean | TextlintRuleOptions>
>;

export type TextlintConfigOptions = {
  /** @default 'ja-technical-writing' */
  style?: TextlintStyle;
  /** Add `preset-ai-writing`. @default true */
  aiWriting?: boolean;
  /** Add `preset-ja-spacing`. @default true */
  spacing?: boolean;
  /** Override or disable individual preset rules by ruleId. */
  rules?: TextlintRuleOverrides;
};

export declare function createBaseConfig(
  options?: TextlintConfigOptions,
): TextlintKernelDescriptor;
