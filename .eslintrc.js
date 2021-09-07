module.exports = {
  globals: {
    graphql: true,
    __PATH_PREFIX__: true,
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['airbnb-typescript', 'prettier'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    // return typeの型推論はTypeScriptに任せる
    '@typescript-eslint/explicit-function-return-type': 'off',
    // propsのスプレッド代入でエラーを発生させない
    'react/jsx-props-no-spreading': 'off',
    // Redux Toolkitのための設定
    'no-param-reassign': [
      'error',
      { props: true, ignorePropertyModificationsFor: ['state'] },
    ],
    // temporary
    '@typescript-eslint/no-unused-vars': 'off',
  },
  overrides: [
    {
      // TypeScriptのみに適用する設定
      files: ['*.ts', '*.tsx'],
      extends: ['airbnb-typescript', `prettier`],
      rules: {
        // '.tsx'ファイルを許容する
        'react/jsx-filename-extension': [
          'error',
          { extensions: ['.jsx', '.tsx'] },
        ],
        // Propの型推論をTypeScriptに任せる
        'react/prop-types': 'off',
        'react/no-unused-prop-types': 'off',
        'react/require-default-props': 'off',
        'react/jsx-props-no-spreading': 'off',
        // temporary
        '@typescript-eslint/no-unused-vars': 'off',
        // Redux Toolkitのための設定
        'no-param-reassign': [
          'error',
          { props: true, ignorePropertyModificationsFor: ['state'] },
        ],
      },
    },
  ],
};
