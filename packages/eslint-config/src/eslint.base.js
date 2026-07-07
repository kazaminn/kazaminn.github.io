import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import vitestPlugin from '@vitest/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('../.gitignore', import.meta.url));

export function createBaseConfig(tsconfigRootDir) {
  return [
    {
      ignores: [
        '**/*.config.*',
        'eslint.config.js',
        '.storybook/**',
        'scripts/**',
        'worker-configuration.d.ts',
      ],
    },
    includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
    {
      files: ['**/*.{js,mjs,cjs}'],
      extends: [js.configs.recommended],
      languageOptions: {
        globals: globals.node,
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: [
              '*.config.{ts,js,mjs,cjs}',
              '*.d.ts',
              'test/*.d.ts',
              'test/*.{ts,tsx}',
            ],
          },
          tsconfigRootDir,
        },
      },
      rules: {
        // Function style: unify on arrow + const
        'func-style': ['error', 'expression', { allowArrowFunctions: true }],
        'arrow-body-style': ['error', 'as-needed'],
        'prefer-arrow-callback': 'error',

        // Type definition style: prefer `type`
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/method-signature-style': ['error', 'property'],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],

        // Banned syntax: enum / any / non-null assertion
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'No enum. Use an as-const object or a union type.',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',

        // -Strict null / undefined handling
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': [
          'error',
          {
            ignoreConditionalTests: true,
            ignoreMixedLogicalExpressions: false,
          },
        ],
        '@typescript-eslint/strict-boolean-expressions': [
          'warn',
          {
            allowString: true,
            allowNumber: false,
            allowNullableObject: true,
            allowNullableBoolean: false,
            allowNullableString: false,
            allowNullableNumber: false,
            allowAny: false,
          },
        ],

        // switch: force exhaustive handling of unions
        '@typescript-eslint/switch-exhaustiveness-check': [
          'error',
          { requireDefaultForNonUnion: true },
        ],

        // Unused vars: allow `_` prefix as intentional
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],

        // any-derived unsafe family: warn while paying down gradually
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',

        // Logging
        'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },

    // Test files: enable Vitest rules, relax any-derived unsafe family, allow console
    {
      files: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**/*.{ts,tsx}',
      ],
      plugins: { vitest: vitestPlugin },
      rules: {
        ...vitestPlugin.configs.recommended.rules,
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'no-console': 'off',
      },
      languageOptions: {
        globals: { ...vitestPlugin.environments.env.globals },
      },
    },
  ];
}
