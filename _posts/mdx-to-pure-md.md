---
slug: "mdx-to-pure-md"
title: "なんとなく使っていたMDXをやめてreact-markdownに切り替えた"
date: "2026-07-12T21:50:00+09:00"
category: "Technical"
summary: "なんとなくMDX形式を使っていたんだけど、それ要らなくね？ってなったので、普通のMarkdownに戻した話"
---

なんとなくMDX形式を使っていたんだけど、それ要らなくね？ってなった件についてメモ。

## なんとなくMDXを採用

そもそも、このブログは[blog-starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter)というボイラープレートを使っていて、それにはremark-htmlがバンドルされていた。

markdownからhtmlに直行するのではなく、next/linkやnext/imageを噛ませたいなと思って、それならMDX使えばいっか、と深く考えずに[next-mdx-remote-client](https://github.com/ipikuka/next-mdx-remote-client)を選択した。

## MDXに潜む罠たち

### 構造上、任意のコードを実行できる

MDXは、ただのmarkdown文書ではなく、実行可能なソースコードとして扱われるため、悪意を持つユーザーが悪意のあるスクリプトを本来テキストファイルであるはずのMarkdownの中に埋め込むことができる。MDXの[公式サイト](https://mdxjs.com/docs/getting-started/#security)でも以下のように注意喚起されている。

> MDX is a programming language. If you trust your authors, that’s fine. If you don’t, it’s unsafe.
>
> Do not let random people from the internet write MDX. If you do, you might want to look into using `<iframe>`s with sandbox, but security is hard, and that doesn’t seem to be 100%. For Node.js, vm2 sounds interesting. But you should probably also sandbox the whole OS using Docker or similar, perform rate limiting, and make sure processes can be killed when taking too long.

昨年末、React Server Componentのコア部分にセキュリティリスクが発覚したことは記憶に新しい（[Next.js Security Advisory: CVE‑2025‑66478](https://nextjs.org/blog/CVE-2025-66478)）。このブログは静的エクスポートなので直接的な影響は受けなかったものの、[axios乗っ取り事件](https://qiita.com/nogataka/items/17c497375ed2c6c3d054)もあったりして「みんなが使っているから、使う」では危ういことを認識させられた。

なお素のmarkdownであっても`allowDangerousHtml`オプションを有効にした場合には、XSS対策として`<script>`タグを除去するサニタイズ処理は必須である。

### 不等号がJSXタグと誤認されビルドごと落ちる

コードを実行されないとしても、本文中に書いた不等号をMDXパーサーがJSXタグと誤って認識してしまっただけで、ビルドごと落ちてしまうことがある。

たとえば本文中に`very_rare (<10件)`と書いたところ`<`が開始タグ扱いされてしまった。

それでビルドが落ちないように、ASTが正しく構築されるようにエスケープ処理をしている。素のMarkdownであってもあらかじめエスケープ処理をしておくことで、想定外のビルドエラーを防ぐことができる。

## WordPressのShortcodeを変換するRemarkプラグインを作った

ちょうどWordPressからNext.jsに移行したいプロジェクトがあって、移行元では使用しているテーマ固有のショートコードが多用されている。

WordPressには[Shortcode](https://codex.wordpress.org/Shortcode)機能があって、たとえば、`[gallery id="123" size="medium"]`のように書くことができる。

この機能を再現する必要があって、MDXの利点を生かしてMarkdownにコンポーネントを直書きしようかと考えたのだが、MDXに直書きするよりはTSXファイルに書いたほうが、Typingが素直に効くし、ESLintでのエラーチェックもしやすいことが分かった。

結局、Remarkプラグインを自作して、ショートコード記法を使えるようにした。

まず、WordPressのエクスポートデータを前処理でMarkdownに変換し、プラグイン対応の記法にしておく。

```md
[[demo key="button"]]
```

これが、このようなHTML出力となる。

```html
<div data-shortcode="demo" data-key="button"></div>
```

先に述べたサニタイズ処理では`div`要素と`data-*`属性を許可しているので、raw HTMLのまま渡される。アプリ側でレンダリングする際に、コンポーネントをマッチングし、propsを渡す。propsは必要に応じてバリデーションし不正な値が渡るのを防ぐ。

最終的には、以下のような実コンポーネントに変換される。

```jsx
<Demo demoKey="button" />
```

この方法であればそもそもMDX形式である必要がなくなる。

## react-markdownに置き換える

MDXでなくても必要な要件を満たせることが分かったので、[react-markdown](https://github.com/remarkjs/react-markdown)に置き換えた。Shortcode以外にもRemark/Rehypeプラグインを自作して差し込んでいるのだが、MDXに依存しているものは無く、ラッパーを差し替えるだけで終わった。

MDXを剥がしたことによって、ただのテキスト文書になり、他のフレームワークでも安全に再利用できるものになった。めでたし、めでたし。
