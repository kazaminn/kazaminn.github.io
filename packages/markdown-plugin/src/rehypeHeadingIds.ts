import { createHash } from 'node:crypto';
import type { Element, Root as HastRoot, Text as HastText } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * 見出し要素に、テキスト内容の md5 ハッシュから生成した安定 id を付与する。
 */
export const rehypeHeadingIds =
  () =>
  (tree: HastRoot): void => {
    visit(tree, 'element', (node: Element) => {
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
        const textContent = node.children
          .filter((c): c is HastText => c.type === 'text')
          .map((c) => c.value)
          .join('');

        const hash = createHash('md5')
          .update(textContent)
          .digest('hex')
          .slice(0, 6);
        node.properties.id = `h-${hash}`;
      }
    });
  };
