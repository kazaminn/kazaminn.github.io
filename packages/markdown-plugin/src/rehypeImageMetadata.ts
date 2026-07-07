import fs from 'node:fs';
import path from 'node:path';
import type { Element, Root as HastRoot } from 'hast';
import sizeOf from 'image-size';
import { visit } from 'unist-util-visit';

export type RehypeImageMetadataOptions = {
  /**
   * ローカル画像（`/...` 始まりの src）を解決する公開ディレクトリの絶対パス。
   * 省略時は `<cwd>/public`。
   */
  publicDir?: string;
};

/**
 * ローカル画像の実寸を読み取って img に width/height を付与する。
 * `./images/...` は `/images/...` に正規化する。
 */
export const rehypeImageMetadata = (
  options: RehypeImageMetadataOptions = {},
) => {
  const publicDir = options.publicDir ?? path.join(process.cwd(), 'public');

  return (tree: HastRoot): void => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;

      let src = node.properties.src;
      if (typeof src !== 'string') return;

      if (src.startsWith('./images/')) {
        src = src.replace('./images/', '/images/');
        node.properties.src = src;
      }

      if (src.startsWith('/')) {
        const imagePath = path.join(publicDir, src);
        if (fs.existsSync(imagePath)) {
          try {
            const buffer = fs.readFileSync(imagePath);
            const dimensions = sizeOf(buffer);
            node.properties.width = dimensions.width;
            node.properties.height = dimensions.height;
          } catch (err) {
            console.error(`Error sizing image: ${imagePath}`, err);
          }
        }
      }
    });
  };
};
