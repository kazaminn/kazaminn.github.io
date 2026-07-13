---
slug: "remark-csv-to-table"
title: "Prettier の Markdown テーブル整形を remark プラグインで回避する"
date: "2026-06-25T11:34:00+09:00"
category: "Technical"
summary: "Prettier が Markdown テーブルの列幅を揃える挙動で diff が壊れる問題を、CSV/TSV コードブロックを remark プラグインで変換する方法を考えた。"
---

PrettierにはMarkdownの表もカラム幅をそろえて見やすくする機能がある。小さくコンパクトな表なら確かに読みやすいが、整形されるとかえって読みづらくなることがある。

- 長い説明が1セル入るだけで、その列幅に全行が引っ張られる。横にだらだら伸びて、かえって可読性が落ちる。
- セルの内容を一か所書き換えると、整列のために全行が書き直される。差分エディターで見たときにどこが修正されたのか分かりづらい。

具体例はこうだ。

Before:

```text
| おやつ | カテゴリ | カロリー | コメント |
| - | - | - | - |
| ポテチ | スナック | 336kcal | ポテトチップスの略称。止まらなくなる、塩分の暴力。 |
| チョコ | 菓子 | 279kcal | 疲れたときの回復アイテム。 |
| プリン | デザート | 113kcal | なめらか。 |
```

After:

```text
| おやつ | カテゴリ | カロリー | コメント                                           |
| ------ | -------- | -------- | -------------------------------------------------- |
| ポテチ | スナック | 336kcal  | ポテトチップスの略称。止まらなくなる、塩分の暴力。 |
| チョコ | 菓子     | 279kcal  | 疲れたときの回復アイテム。                         |
| プリン | デザート | 113kcal  | なめらか。                                         |
```

## オプションで無効にしたい願望は実現されていない

この挙動を改善してほしいという要望は古くからある。

- [Issue #5651 markdown : compact formatted table](https://github.com/prettier/prettier/issues/5651)（2018年12月）
- [Issue #12074 Keep Markdown compact tables compact & Git history clean](https://github.com/prettier/prettier/issues/12074)（2022年1月）

`compact`のようなオプションを足してくれたほうが`<!-- prettier-ignore -->`で本文を汚さずにすむのだが、現状ではignoreするしかない。

## 検討した回避策

最初に考えた案は、Markdown全体は別のフォーマッタ（markdownlintなど）に任せて、コードブロックの中身だけPrettierに渡す、という分離案。

スクリプトを書いてpre-commitフックで処理すれば、Prettierが表を整形するのを防げる。

これだと、Markdownソースの読みやすさとコードブロック内部の読みやすさを両立させることができるが、仕組みがやや複雑になってしまう。

次に考えた案が今回の解決策で、テーブルを整列されたくないなら、そもそも整列対象のGFMテーブルとして書かなければいい。

## 方針: ソースはCSV/TSV、変換はRemarkプラグイン

ソースは生のCSV/TSVのままコードブロックで囲み、言語を`csv-table`あるいは`tsv-table`として、ビルド時にプラグインでGFMテーブルへ変換する。さきほどの例でいうとこんな感じ。

```text
\`\`\`csv-table
おやつ,カテゴリ,カロリー,コメント
ポテチ,スナック,336kcal,ポテトチップスの略称。止まらなくなる、塩分の暴力。
チョコ,菓子,279kcal,疲れたときの即効回復アイテム
プリン,デザート,113kcal,なめらか
\`\`\`
```

この方式にはメリットが2つある。

- (1) Prettierはコードブロックの中身に手を出さない。列幅整列は起きないし、diffも1行変更なら1行で済む。
- (2) GitHubのプレビューでもコードブロックとして中身がそのまま表示される。変換前でもテキストレベルで内容にアクセスできるので、アクセシビリティを損なわない。

普通のGFMテーブル記法も今まで通り使えるので、フォーマットされたくない票だけ、CSV/TSVをそのまま書く、という使い分け方ができる。

## RFC 4180を踏まえる

ところで、CSVのフォーマットは[RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)で定義されている。要点だけ拾うと、フィールドはカンマ区切りで、レコードは改行区切り。値の中にカンマ・改行・ダブルクォートを含めたい場合は、その値全体をダブルクォートで囲う。そして囲った値の中のダブルクォートは、`""`と2つかさねて1つの`"`を表す。

このエスケープ規則により、説明文にカンマが入っても改行が入っても壊れなくなる。`csv-table`はこのRFC 4180準拠のカンマ区切り、`tsv-table`はタブ区切り、として実装した。タブ区切りなら値にカンマが入ってもクォート不要で書けるので、用途で選べる。

## 実装

`csv-table`/`tsv-table`という言語指定のコードブロックを、mdastの`table`ノードに差し替えるRemarkプラグインを作成する。

```ts
import type {
  Code,
  Root as MdastRoot,
  Table,
  TableCell,
  TableRow,
} from "mdast";
import { visit } from "unist-util-visit";

type Delimiter = "," | "\t";

const LANG_DELIMITERS: Record<string, Delimiter> = {
  "csv-table": ",",
  "tsv-table": "\t",
};
```

### パーサ

RFC 4180のクォート規則に従うため、文字列を1文字ずつ読み込み状態を判定する。クォート内側の状態（`inQuotes`）と、その値がクォートで囲われていたかを調べて、非クォート値だけ前後の空白をトリムし、クォート値はそのまま残す。

`""`のエスケープは、クォート内で`"`を見つけたとき次の文字も`"`かどうかで判定する。次も`"`ならリテラルの`"`として積んで1文字読み飛ばし、そうでなければクォートの終わりとみなす。

```ts
const parseDelimited = (input: string, delimiter: Delimiter): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let quoted = false;

  const pushField = (): void => {
    row.push(quoted ? field : field.trim());
    field = "";
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
    } else if (char === "\n") {
      pushRow();
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((cells) => !(cells.length === 1 && cells[0] === ""));
};
```

最後のフィルターは、空行を捨てている。区切りと値がない行（パースすると`['']`になる行）が混じると、空のテーブル行ができてしまうためだ。

### テーブル構築

パース結果からmdastの`table`ノードを組み立てる。列数はヘッダ行（先頭行）に合わせて固定する。データ行の列が足りなければ空セルで埋め、ヘッダより多い分は切り捨てる。

```ts
const buildTable = (rows: string[][]): Table => {
  const columnCount = rows[0].length;

  const toRow = (cells: string[]): TableRow => ({
    type: "tableRow",
    children: Array.from(
      { length: columnCount },
      (_, i): TableCell => ({
        type: "tableCell",
        children: [{ type: "text", value: cells[i] ?? "" }],
      }),
    ),
  });

  return {
    type: "table",
    align: Array.from({ length: columnCount }, () => null),
    children: rows.map(toRow),
  };
};
```

`align`は列ごとの寄せ方向で、今回は全列`null`（指定なし）にしている。mdastの`align`の型は寄せ方向か`null`を取るので、ここは仕様に従って`null`を入れている。

### visitor

あとは`code`ノードを走査し、対象の言語指定ならテーブルに差し替えるだけだ。

```ts
export const remarkCsvTable = () => {
  return (tree: MdastRoot): void => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (parent == null || index == null) return;

      const lang = node.lang?.toLowerCase();
      if (lang == null || !(lang in LANG_DELIMITERS)) return;

      const rows = parseDelimited(node.value, LANG_DELIMITERS[lang]);
      if (rows.length === 0) return;

      parent.children[index] = buildTable(rows);
    });
  };
};
```

`parent.children[index]`を直接書き換えて、コードブロックをテーブルノードに置き換えている。

## まとめ

Prettierの列幅整列を回避するため、ソースをCSV/TSVのコードブロックで持ち、remarkプラグインで変換する。これにより自動フォーマットを回避しつつ、GitHubなどのプレビュー画面でも中身を読める状態を保つことができる。ビルド段階でrehypeに渡せばHTMLのテーブルに変換される仕組みを構築した。

これでPrettierとの仲良し度が少しアップする、はず。
