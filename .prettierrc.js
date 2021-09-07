module.exports = {
  arrowParens: 'avoid',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        parser: `markdown-nocjsp`,
      },
    },
  ],
};
