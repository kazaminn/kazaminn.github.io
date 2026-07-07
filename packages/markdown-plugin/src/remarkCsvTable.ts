import type {
  Code,
  Root as MdastRoot,
  Table,
  TableCell,
  TableRow,
} from 'mdast';
import { visit } from 'unist-util-visit';

type Delimiter = ',' | '\t';

// コードブロックの言語指定 -> 区切り文字。
// csv-table は半角カンマのみ（RFC4180 準拠）、tsv-table はタブ。
const LANG_DELIMITERS: Record<string, Delimiter> = {
  'csv-table': ',',
  'tsv-table': '\t',
};

/**
 * 区切り値テキストを行×列へパースする。
 * - ダブルクォートで囲った値は区切り・改行・"" エスケープを許容する。
 * - 非クォート値は前後の空白を trim する。
 */
const parseDelimited = (input: string, delimiter: Delimiter): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let quoted = false;

  const pushField = (): void => {
    row.push(quoted ? field : field.trim());
    field = '';
    quoted = false;
  };
  const pushRow = (): void => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      quoted = true;
    } else if (char === delimiter) {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) pushRow();

  // 空行（区切りも値も無い行）は捨てる。
  return rows.filter((cells) => !(cells.length === 1 && cells[0] === ''));
};

const buildTable = (rows: string[][]): Table => {
  const columnCount = rows[0].length;

  const toRow = (cells: string[]): TableRow => ({
    type: 'tableRow',
    children: Array.from(
      { length: columnCount },
      (_, i): TableCell => ({
        type: 'tableCell',
        children: [{ type: 'text', value: cells[i] ?? '' }],
      }),
    ),
  });

  return {
    type: 'table',
    align: Array.from({ length: columnCount }, () => null),
    children: rows.map(toRow),
  };
};

/**
 * 言語指定が `csv-table` / `tsv-table` のコードブロックを
 * GFM テーブル（先頭行をヘッダ）へ変換する。列数はヘッダ行に合わせる。
 */
export const remarkCsvTable =
  () =>
  (tree: MdastRoot): void => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (parent == null || index == null) return;

      const lang = node.lang?.toLowerCase();
      if (lang == null || !(lang in LANG_DELIMITERS)) return;

      const rows = parseDelimited(node.value, LANG_DELIMITERS[lang]);
      if (rows.length === 0) return;

      parent.children[index] = buildTable(rows);
    });
  };
