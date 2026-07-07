import type { Root as MdastRoot, Paragraph } from 'mdast';
import { visit } from 'unist-util-visit';
import { setHastElement } from './hast';

// 段落全体が 1 つのショートコードのみで構成されるブロックを対象にする。
// 例: [[demo key="button" type="outline"]]
const SHORTCODE_REGEX = /^\[\[\s*([A-Za-z][\w-]*)\s*([\s\S]*?)\s*\]\]$/;

// key="value" / key='value' / key=value / 単独フラグ key を抽出する。
const ARG_REGEX = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

const parseArgs = (raw: string): Record<string, string> => {
  const args: Record<string, string> = {};
  ARG_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ARG_REGEX.exec(raw)) !== null) {
    const [, key, doubleQuoted, singleQuoted, unquoted] = match;
    // 値が無い単独フラグは "true" とする。バリデーションはアプリ側の責務。
    args[key] = doubleQuoted ?? singleQuoted ?? unquoted ?? 'true';
  }
  return args;
};

/**
 * `[[name key="value" ...]]` 形式のショートコードを
 * `<div data-shortcode="name" data-key="value" ...>` へ変換する。
 * 引数の数は任意。引数のバリデーションと描画はアプリ側が行う。
 */
export const remarkShortcode =
  () =>
  (tree: MdastRoot): void => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'text') return;

      const match = SHORTCODE_REGEX.exec(child.value.trim());
      if (!match) return;

      const [, name, rawArgs] = match;
      const dataAttributes: Record<string, string> = {
        'data-shortcode': name,
      };
      for (const [key, value] of Object.entries(parseArgs(rawArgs))) {
        dataAttributes[`data-${key}`] = value;
      }

      setHastElement(node, 'div', dataAttributes);
      node.children = [];
    });
  };
