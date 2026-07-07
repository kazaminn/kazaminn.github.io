/**
 * GitHub-Styled Alert で利用できるブロック種別名（標準セット）。
 * remark プラグインはこのキー名のみを必要とする。
 * タイトル・アイコン・配色などの描画はアプリ側が担当する。
 * @see https://docs.github.com/ja/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */
export const CUSTOM_BLOCK_TYPE_NAMES = [
  'NOTE',
  'TIP',
  'IMPORTANT',
  'WARNING',
  'CAUTION',
] as const;

export type CustomBlockType = (typeof CUSTOM_BLOCK_TYPE_NAMES)[number];
