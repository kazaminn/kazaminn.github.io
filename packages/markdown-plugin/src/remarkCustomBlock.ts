import type { Blockquote, Root as MdastRoot, Paragraph, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { CUSTOM_BLOCK_TYPE_NAMES, type CustomBlockType } from './blockTypes';
import { setHastElement } from './hast';

const CUSTOM_BLOCK_REGEX = new RegExp(
  `^\\[!(${CUSTOM_BLOCK_TYPE_NAMES.join('|')})\\]\\n?`,
  'i',
);

/**
 * GitHub-Styled Alert Syntax を `<div data-custom-block-type="...">` へ変換する。
 * 実際の見た目はこの属性を受け取るアプリ側コンポーネントが描画する。
 * @see https://docs.github.com/ja/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */
export const remarkCustomBlock =
  () =>
  (tree: MdastRoot): void => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const firstChild = node.children[0];
      if (firstChild?.type !== 'paragraph') return;

      const paragraph: Paragraph = firstChild;
      const firstTextNode = paragraph.children[0];
      if (firstTextNode?.type !== 'text') return;

      const textNode: Text = firstTextNode;
      const match = CUSTOM_BLOCK_REGEX.exec(textNode.value);
      if (!match) return;

      const blockType = match[1] as CustomBlockType;

      textNode.value = textNode.value.replace(CUSTOM_BLOCK_REGEX, '');

      setHastElement(node, 'div', { 'data-custom-block-type': blockType });

      if (
        paragraph.children.length === 0 ||
        (paragraph.children.length === 1 && textNode.value === '')
      ) {
        node.children = node.children.slice(1);
      }
    });
  };
