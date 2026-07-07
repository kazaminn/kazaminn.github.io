import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import a11yPlugin from 'eslint-plugin-jsx-a11y';
import playwrightPlugin from 'eslint-plugin-playwright';
import hooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import zodPlugin from 'eslint-plugin-zod';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import { createBaseConfig } from './eslint.base.js';

export const nextConfig = (tsconfigRootDir) => {
  const baseConfig = createBaseConfig(tsconfigRootDir);

  const nextConfig = [
    globalIgnores(['.next/**', 'next-env.d.ts']),
    {
      files: ['**/*.{ts,tsx}'],
      plugins: {
        'react-hooks': hooksPlugin,
        'jsx-a11y': a11yPlugin,
        '@next/next': nextPlugin,
      },
      languageOptions: {
        globals: {
          ...globals.browser,
        },
      },
      settings: {
        react: { version: 'detect' },
      },
      rules: {
        ...hooksPlugin.configs.recommended.rules,
        ...a11yPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/interactive-supports-focus': 'error',
        'jsx-a11y/no-aria-hidden-on-focusable': 'error',
        'jsx-a11y/prefer-tag-over-role': 'warn',
      },
    },
    // App Router convention files use `export default function` — relax func-style
    {
      files: [
        '**/app/**/{page,layout,template,loading,error,not-found,route}.tsx',
      ],
      rules: {
        'func-style': 'off',
      },
    },
    // JSX files: `{value && <El/>}` on optional strings is idiomatic React,
    // not worth the Boolean() ceremony strict-boolean-expressions otherwise demands.
    {
      files: ['**/*.tsx'],
      rules: {
        '@typescript-eslint/strict-boolean-expressions': [
          'warn',
          {
            allowString: true,
            allowNumber: false,
            allowNullableObject: true,
            allowNullableBoolean: false,
            allowNullableString: true,
            allowNullableNumber: false,
            allowAny: false,
          },
        ],
      },
    },
    {
      files: ['**/*.stories.{ts,tsx}'],
      plugins: { storybook: storybookPlugin },
      rules: {
        ...storybookPlugin.configs['flat/recommended'].rules,
        // no-uninstalled-addons requires linting .storybook/, which we exclude
        // (avoids tsconfig include / type-checked conflicts). Disabled intentionally.
        'storybook/no-uninstalled-addons': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    {
      files: ['e2e/**/*.{ts,tsx}'],
      plugins: { playwright: playwrightPlugin },
      rules: {
        ...playwrightPlugin.configs['flat/recommended'].rules,
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
    zodPlugin.configs.recommended,
    prettierConfig,
  ];

  return defineConfig([...baseConfig, ...nextConfig]);
};
