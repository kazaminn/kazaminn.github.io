import path from 'node:path';
import rehypeRaw from 'rehype-raw';
import { rehypeHeadingIds } from './rehypeHeadingIds';
import {
  rehypeImageMetadata,
  type RehypeImageMetadataOptions,
} from './rehypeImageMetadata';
import { remarkCsvTable } from './remarkCsvTable';
import { remarkCustomBlock } from './remarkCustomBlock';
import { remarkShortcode } from './remarkShortcode';

export const createMarkdownPlugins = (rootDir: string = process.cwd()) => {
  const publicDir = path.join(rootDir, 'public');

  const imageMetadata: [
    typeof rehypeImageMetadata,
    RehypeImageMetadataOptions,
  ] = [rehypeImageMetadata, { publicDir }];

  return {
    remarkPlugins: [remarkCustomBlock, remarkShortcode, remarkCsvTable],
    rehypePlugins: [rehypeRaw, rehypeHeadingIds, imageMetadata],
  };
};
