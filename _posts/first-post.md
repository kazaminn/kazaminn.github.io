---
slug: "first-post"
title: "Next.jsでブログをつくってみる"
date: "2026-01-22T20:41:00+09:00"
category: "Technical"
summary: "Next.jsでブログサイトを構築し、GitHub Actionsで自動ビルド＆デプロイまで。"
---

記念すべき一投目はこのブログを作るところから。

## Next.jsで作ってみるか

最近はReactばかり触っているのであまり深く考えずに[Next.js](https://nextjs.org/)を選定。

今回はじめて作るのでVercel公式の[Next.js Blog Starter Kits &amp; Templates](https://vercel.com/templates/next.js/blog-starter-kit)をボイラープレートにして作っていきます。

このサンプルに対応するGitHubリポジトリは[next.js/examples/blog-starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter)です。

コードをざっと確認したところReact 19ベースでApp Router使用, TypeScript。Tailwind v3で、コンポーネントのスタイル指定はCSS Modulesを併用しているっぽいです。

```bash
npx create-next-app --example blog-starter blog-starter-app
```

## PrettierとESLintを導入する

サンプルのファイルにはフォーマッタやLinterが設定されていないので、設定します。

ESLintの設定に関しては[Configuration: ESLint | Next.js](https://nextjs.org/docs/app/api-reference/config/eslint)参照。

```bash
npm i -D eslint eslint-config-next eslint-config-prettier
```

Prettierとあわせてimport行を並べ替えるプラグインと、Tailwind公式のCSSクラスをいい感じにソートするプラグインを入れておきます。cf. [Automatic Class Sorting with Prettier - Tailwind CSS](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier)

```bash
npm i -D prettier @trivago/prettier-plugin-sort-imports prettier-plugin-tailwindcss
```

その他にやることとしては、Faviconの差し替えでしょうか。今回は[favicon.io](https://favicon.io/)でまとめて生成しました。

## Tailwindをv3 -> v4にアップグレード

ここでTailwindCSSをv4にアップグレードすることにします。Tailwind公式の[Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)でマイグレーションツールが紹介されていたので、使います。

```bash
npx @tailwindcss/upgrade
```

Tailwindの設定ファイルの内容がグローバルCSSに移行されました。

さっそく開発サーバーがエラーを吐きました。

```
CssSyntaxError: tailwindcss: C:\path\to\src\app\_components\markdown-styles.module.css:1:1: Cannot apply unknown utility class `text-lg`. Are you using CSS modules or similar and missing `@reference`? https://tailwindcss.com/docs/functions-and-directives#reference-directive
```

`@reference`をミッシングしているらしいのでCSS Modulesファイルの冒頭に参照をはります。

```
@reference "tailwindcss";
```

さらに、PrettierのTailwindプラグインが動作していないことにも気付きました。[プラグインのREADME](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)を見たら、Tailwind v4の場合は`tailwindStylesheet`キーでCSSのエントリーポイントを特定しないといけないと書かれていました。

最終的に`.prettierrc`はこんな感じ。

```json
{
  "trailingComma": "es5",
  "semi": true,
  "singleQuote": false,
  "plugins": [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],
  "importOrder": [
    "^react$",
    "^next$",
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "^@/[^/]+/(.*)$",
    "^[./]"
  ],
  "tailwindStylesheet": "./src/app/globals.css"
}
```

## SSGでビルドしてGitHub Pagesにデプロイする

結局サンプルをいったん更地にしてコンポーネントを作り直し、ダークモードも自分で実装してみたのですが、通常のReactアプリとは異なりUIがフリッカ―する問題があるので、少し手こずりましたね。その話は別記事にします。

SSGでビルドするにはnext.config.jsを以下のように設定しておきます。

```js
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "dist",
};

module.exports = nextConfig;
```

`next build`コマンドでビルドすると静的HTMLが生成されます。次に`next start`を使うとSSRになってしまうので、ローカルでの動作確認は`npx serve dist`コマンドを使います。

デプロイ先はお手軽さ優先でGitHub Pagesに。GitHub Actionsのワークフローで自動的にビルドとデプロイを実行します。

ワークフローを記述するYAMLファイルは、あらかじめNext.js用のテンプレートが用意されているので、ほぼデフォルトのまま使うことができます。変更の監視範囲（`_posts`と`app`）と出力フォルダ（`out`から`dist`に変更）の設定だけ変更しました。

ここまで作ったあとで気づいたのですが、Blog Starterよりも[Next.js Portfolio Starter](https://portfolio-blog-starter.vercel.app/)のほうがダイナミックOG画像生成やシンタックスハイライトがあらかじめ設定されており、使いやすいかもしれません。

現時点では、とりあえずページを表示できるだけの状態なので、改善を重ねて使いやすいものにしていきたいと思います。
