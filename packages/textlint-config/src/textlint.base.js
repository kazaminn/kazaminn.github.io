import { TextlintKernelDescriptor } from '@textlint/kernel';
import { moduleInterop } from '@textlint/module-interop';
import markdownPlugin from '@textlint/textlint-plugin-markdown';
import textPlugin from '@textlint/textlint-plugin-text';
import presetAiWriting from 'textlint-rule-preset-ai-writing';
import presetJaSpacing from 'textlint-rule-preset-ja-spacing';
import presetJaTechnicalWriting from 'textlint-rule-preset-ja-technical-writing';
import presetJapanese from 'textlint-rule-preset-japanese';
import presetJtfStyle from 'textlint-rule-preset-jtf-style';

// Presets ship in mixed module shapes: most expose `{ rules, rulesConfig }` on
// their default export, a few nest it one level deeper (`default.default`).
const asPreset = (preset) =>
  preset != null && 'rules' in preset ? preset : preset.default;

// The config-loader expands presets into individual rules when it resolves them
// by name; passing modules directly to the kernel, we do that expansion here.
const expandPreset = (presetName, preset) => {
  const { rules, rulesConfig } = asPreset(preset);
  return Object.keys(rules).map((ruleKey) => ({
    ruleId: `${presetName}/${ruleKey}`,
    rule: rules[ruleKey],
    options: rulesConfig?.[ruleKey] ?? true,
  }));
};

// The three prose style presets are mutually overlapping style guides — pick
// exactly one via `style`, don't stack them.
const STYLE_PRESETS = {
  japanese: ['preset-japanese', presetJapanese],
  'ja-technical-writing': [
    'preset-ja-technical-writing',
    presetJaTechnicalWriting,
  ],
  'jtf-style': ['preset-jtf-style', presetJtfStyle],
};

// Accept both a flat ruleId key (`preset-x/rule`) and the textlintrc-style
// nested preset map (`{ 'preset-x': { rule: opts } }`); flatten the latter so a
// single lookup table drives everything. A non-slashed key with an object value
// is the nested form; a boolean value is a whole-preset toggle.
const flattenOverrides = (overrides) =>
  Object.fromEntries(
    Object.entries(overrides).flatMap(([key, value]) =>
      !key.includes('/') && value !== null && typeof value === 'object'
        ? Object.entries(value).map(([ruleKey, ruleValue]) => [
            `${key}/${ruleKey}`,
            ruleValue,
          ])
        : [[key, value]],
    ),
  );

// `concat` keeps the first descriptor's rule on a duplicate ruleId, so it can
// add new rules but not override preset ones. Apply overrides here at expansion
// time instead: `false` drops a rule, `true` keeps its defaults, anything else
// replaces its options. A whole-preset key (e.g. `preset-ai-writing`) applies to
// every rule in that preset unless a more specific ruleId key also matches.
const applyOverrides = (rules, rawOverrides) => {
  const overrides = flattenOverrides(rawOverrides);
  return rules.flatMap((rule) => {
    const presetName = rule.ruleId.slice(0, rule.ruleId.indexOf('/'));
    const key =
      rule.ruleId in overrides
        ? rule.ruleId
        : presetName in overrides
          ? presetName
          : undefined;
    if (key === undefined) return [rule];
    const override = overrides[key];
    if (override === false) return [];
    if (override === true) return [rule];
    return [{ ...rule, options: override }];
  });
};

// Descriptor for textlint's module API: createLinter({ descriptor: createBaseConfig() }).
export function createBaseConfig(options = {}) {
  const {
    style = 'ja-technical-writing',
    aiWriting = true,
    spacing = true,
    rules: overrides = {},
  } = options;

  const rules = applyOverrides(
    [
      ...expandPreset(...STYLE_PRESETS[style]),
      ...(aiWriting ? expandPreset('preset-ai-writing', presetAiWriting) : []),
      ...(spacing ? expandPreset('preset-ja-spacing', presetJaSpacing) : []),
    ],
    overrides,
  );

  return new TextlintKernelDescriptor({
    rules,
    filterRules: [],
    plugins: [
      { pluginId: '@textlint/markdown', plugin: moduleInterop(markdownPlugin) },
      { pluginId: '@textlint/text', plugin: moduleInterop(textPlugin) },
    ],
  });
}
