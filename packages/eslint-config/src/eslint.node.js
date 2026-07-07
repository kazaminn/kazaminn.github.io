import prettierConfig from 'eslint-config-prettier';
import zodPlugin from 'eslint-plugin-zod';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { createBaseConfig } from './eslint.base.js';

export const nodeConfig = (tsconfigRootDir) => {
  const baseConfig = createBaseConfig(tsconfigRootDir);

  const nodeConfig = [
    {
      files: ['**/*.{ts,tsx,js,mjs,cjs}'],
      languageOptions: { globals: globals.node },
    },
    zodPlugin.configs.recommended,
    prettierConfig,
  ];

  return defineConfig([...baseConfig, ...nodeConfig]);
};
