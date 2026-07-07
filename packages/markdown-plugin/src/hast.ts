import type { Nodes } from 'mdast';

/**
 * mdast ノードに mdast-util-to-hast の変換ヒント（hName / hProperties）を
 * 付与し、出力 HTML 要素のタグ名と属性を上書きする。
 *
 * MDX 固有の mdxJsxFlowElement を作らないため、remark-rehype / remark-html /
 * MDX など mdast-util-to-hast を使う任意のパイプラインで同じ結果になる。
 * @see https://github.com/syntax-tree/mdast-util-to-hast#fields-on-nodes
 */
export const setHastElement = (
  node: Nodes,
  tagName: string,
  properties: Record<string, string>,
): void => {
  const data = (node.data ??= {}) as Record<string, unknown>;
  data.hName = tagName;
  data.hProperties = {
    ...(data.hProperties as Record<string, unknown> | undefined),
    ...properties,
  };
};
