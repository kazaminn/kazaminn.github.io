# Kazaminn's blog

React開発メインの備忘録。Next.jsの静的サイト生成（SSG）で構築し、GitHub Pages（[kazaminn.github.io](https://kazaminn.github.io)）にデプロイしている個人技術ブログ。

記事は`_posts/`配下のMarkdownファイルとして管理し、ファイルを追加するだけで新しい記事ページが生成される。

## 技術スタック

- フレームワーク: [Next.js 16](https://nextjs.org/)（App Router/`output: "export"`によるSSG）
- 言語: TypeScript/React 19
- スタイリング: [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/typography`
- コンテンツ: Markdown + フロントマター（[gray-matter](https://github.com/jonschlinkert/gray-matter)）を[next-mdx-remote-client](https://github.com/ipikuka/next-mdx-remote-client)でMDXとしてレンダリング
- Markdown拡張: [remark-gfm](https://github.com/remarkjs/remark-gfm)/シンタックスハイライトに[rehype-pretty-code](https://rehype-pretty.pages.dev/)（Shiki）
- 画像最適化: [next-image-export-optimizer](https://github.com/Niels-IO/next-image-export-optimizer)（custom loaderによるエクスポート時の最適化）
- パッケージ管理: pnpm（Node.js >= 24）
- ホスティング: GitHub Pages（GitHub Actionsで自動デプロイ）

## 主な機能

- Markdownファイルベースのブログ記事管理（`_posts/*.md`）
- ダークモード対応（FOUCを防ぐinline script付き）
- 記事ごとのOG画像を動的生成（`opengraph-image.tsx`）
- 見出しへの自動ID付与・記事内画像の寸法自動計算（`src/lib/mdxPlugins.ts`）
- パンくずリスト/タグ表示などのコンポーネント

## ディレクトリ構成

```text
.
├── _posts/              # ブログ記事（Markdown）と記事内画像
├── public/              # 静的アセット（画像・favicon など）
├── scripts/
│   ├── prebuild.mjs     # ビルド前処理
│   └── postbuild.mjs    # OG 画像のリネーム・HTML 参照の書き換え
├── src/
│   ├── app/             # App Router（ページ・レイアウト・コンポーネント）
│   │   ├── blog/[slug]/ # 記事詳細ページ・OG 画像生成
│   │   └── _components/ # UI コンポーネント
│   ├── lib/             # 記事取得 API・MDX プラグイン・テーマ管理
│   └── interfaces/      # 型定義（Post / Author）
└── next.config.ts       # SSG / 画像最適化などの設定
```

## セットアップ

```bash
pnpm install
```

### 開発サーバー

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)で開発サーバーが起動する。

### ビルド

```bash
pnpm build
```

`prebuild` → `next build` + 画像最適化 → `postbuild`の順で実行され、静的ファイルが`dist/`出力される。

ローカルで出力結果したいとき:

```bash
pnpm start
```

or

```bash
npx serve dist
```

## 記事の追加

`_posts/`にMarkdownファイルを追加する。フォーマットは以下の通り。

```text
---
title: 記事タイトル
date: ISO 8601形式の現在日時
category: カテゴリ
summary: 記事の概要
---

本文（Markdown / GFM 対応）
```

記事内の画像は`_posts/images/`または`public/`に配置し、Markdownからは`./images/...`のように参照します（ビルド時に`/images/...`へ変換される）。

## デプロイ

`main`ブランチへのpush（`_posts/**`・`src/**`・`next.config.ts`の変更）で、`.github/workflows/nextjs.yml`が実行されGitHub Pagesに自動デプロイされる。Actionsタブから手動実行も可能。
