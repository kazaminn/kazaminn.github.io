# @kazamitte/markdown-plugin

remark/rehypeプラグイン集（React/MDX非依存）。

## Usage

### Preproceser

```tsx
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { normalizeText } from '@kazamitte/markdown-plugin';
import { mdxOptions } from '@/lib/mdxPlugins';
import { useMDXComponents } from '@/lib/useMDXComponent';

type ContentBodyProps = {
  content: string;
};

export default function ContentBody({ content }: ContentBodyProps) {
  const components = useMDXComponents({});

  if (!content) return undefined;

  return (
    <MDXRemote
      source={normalizeText(content)}
      components={components}
      options={mdxOptions}
    />
  );
}
```

### MdxOptions

```ts
import {
  createMarkdownPlugins,
  DEFAULT_ALLOWED_TAGS,
  rehypeSanitize,
} from '@kazamitte/markdown-plugin';

const { remarkPlugins, rehypePlugins } = createMarkdownPlugins(
  import.meta.dirname,
);

const mdxOptions = {
  format: 'md',
  remarkRehypeOptions: { allowDangerousHtml: true },
  remarkPlugins: [...remarkPlugins],
  rehypePlugins: [
    ...rehypePlugins,
    [rehypeSanitize, { allowedTags: [...DEFAULT_ALLOWED_TAGS, 'my-tag'] }], // 最後に呼び出す
  ],
};
```

## Plugins

- remarkCsvTable
- remarkCustomBlock
- remarkShortcode
- rehypeHeadingIds
- rehypeImageMetadata
- rehypeSanitize

## Exports

- `createMarkdownPlugins(rootDir?)` — `rootDir`は画像を解決する`<rootDir>/public`の基準（既定`process.cwd()`）。
- `rehypeSanitize(options?)`
- `normalizeText(content)`
- `CUSTOM_BLOCK_TYPE_NAMES`/`CustomBlockType`

## Build

```sh
pnpm build   # tsc -> dist/
```
