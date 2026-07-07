import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import {
  createMarkdownPlugins,
  rehypeSanitize,
} from '@kazamitte/markdown-plugin';

const { remarkPlugins, rehypePlugins } = createMarkdownPlugins(
  import.meta.dirname,
);

export const markdownRemarkPlugins: PluggableList = [
  remarkGfm,
  ...remarkPlugins,
];

export const markdownRehypePlugins: PluggableList = [
  ...rehypePlugins,
  [
    rehypePrettyCode,
    { theme: 'github-dark-high-contrast', keepBackground: true },
  ],
  rehypeSanitize,
];
