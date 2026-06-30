---
slug: "nextjs-ssg-image-optimization"
title: "Next.js の SSG で next/image が効かないので next-image-export-optimizer を使う"
date: "2026-07-01T08:27:00+09:00"
category: "Technical"
summary: "Next.jsのSSGモードではビルド後に画像を最適化する処理が必要なため next-image-export-optimizerの導入手順と、出力される HTML の変化をまとめた。"
---

Next.jsで静的サイトを生成するときには、`next/image`をそのまま使うことはできない。

## なぜSSGでnext/imageが効かないのか

`next/image`の最適化処理は、内部APIに依存しており、ユーザーがAPIを叩くことによってサーバーサイドの処理が走る。そのため、`output: 'export'`で静的ファイルとして書き出すとAPIを実行できず、Next.jsのデフォルト挙動として画像を最適化せずそのまま出力する。

となると最適化はビルド時に行うしかない。自分でカスタムローダーを用意するのはだるいので`next-image-export-optimizer`を使用する。ビルド後に全画像を複数解像度＋WebPで事前生成し、`srcset`を静的に埋め込む。

## 導入手順

### 1. 画像を`_posts/images`に置く

記事のMarkdownは`_posts`に置いている。画像も`_posts/images`に置けば、記事から相対パスで参照できる。

```md
![キツネの写真](./images/fox-4589927_1280.jpg)
```

執筆中は`./images/fox.jpg`で書けるのでストレスはない。

### 2. prebuildで`public/images`にコピーする

画像ファイルは`public`に置く必要があるので、ビルドする前に`_posts/images`から`public/images`へファイルをコピーするスクリプトを用意する。

```js
import fs from "fs";
import path from "path";

const SOURCE_DIR = path.join(process.cwd(), "_posts/images");
const TARGET_DIR = path.join(process.cwd(), "public/images");

function syncImages() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.warn("Source directory does not exist. Skipping.");
    return;
  }
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }
  try {
    fs.cpSync(SOURCE_DIR, TARGET_DIR, { recursive: true, force: true });
  } catch (err) {
    console.error("Error syncing images:", err);
    process.exit(1);
  }
}

syncImages();
```

スクリプトは`predev`/`prebuild`フックで走らせる。そうすればパッケージマネージャー（npm/pnpm）が`dev`/`build`の前に自動実行する。

```json
{
  "scripts": {
    "predev": "node scripts/prebuild.mjs",
    "prebuild": "node scripts/prebuild.mjs"
  }
}
```

なお、不要なファイルをクリーンアップする処理をまだ用意していないため、ソース画像（`_posts/images`）とコピー先（`public/images`）の両方をgit管理している。

コピー先の`public/images`配下の最適化フォルダは`.gitignore`する。生成物は本番のCIビルドで作られる。

### 3. next-image-export-optimizerを設定する

`next.config.js`にoptimizer用の設定を足す。

```js
/**
 * @type {import('next').NextConfig}
 */

const nextConfig = () => {
  const outputDir = "dist";
  return {
    output: "export",
    trailingSlash: true,
    distDir: outputDir,
    images: {
      loader: "custom",
      imageSizes: [],
      // コンテンツ用 (モバイルRetina(640), Tailwind lg(1024), 最大(1920))
      deviceSizes: [640, 1024, 1920],
    },
    transpilePackages: ["next-image-export-optimizer"],
    env: {
      nextImageExportOptimizer_imageFolderPath: "public/images",
      nextImageExportOptimizer_exportFolderPath: outputDir,
      nextImageExportOptimizer_exportFolderName: "optimized",
      nextImageExportOptimizer_quality: "75",
      nextImageExportOptimizer_storePicturesInWEBP: "true",
      nextImageExportOptimizer_generateAndUseBlurImages: "false",
      nextImageExportOptimizer_remoteImageCacheTTL: "0",
    },
  };
};

module.exports = nextConfig;
```

注意すべきポイントとしては、`distDir`と`exportFolderPath`は一致している必要がある。上記のコードでは分かりやすくするために変数を用意しているが、もし`distDir`キーを省略していればNext.jsのデフォルト値が`out`なので`exportFolderPath`の値は`out`にする。

ビルドコマンドはoptimizerのドキュメントのとおりである。ちなみにoptimizer自体はビルドと同時実行しなくても単体で動作する。

```json
{
  "scripts": {
    "build": "next build && next-image-export-optimizer"
  }
}
```

optimizerは`imageFolderPath`で設定したパスに`next-image-export-optimizer-hashes.json`を自動生成し、ハッシュ値を用いて最適化済みかどうかを判定するので、ビルドのたびに全ての画像を最適化することはない。

### 4. MDXのimgをExportedImageに差し替える

`ExportedImage`は`next/image`のラッパーで、custom loaderを使って複数解像度の`srcset`を生成する。MDXのレンダリングで`img`をこのコンポーネントに差し替える。

```tsx
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import ExportedImage from "next-image-export-optimizer";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    img: ({ src, alt, ...props }: any) => (
      <ExportedImage
        src={src}
        alt={alt || ""}
        sizes="(max-width: 800px) 100vw, 800px"
        style={{ width: "100%", height: "auto" }}
        className="dark:border-border-dark my-8 rounded-xl border border-border shadow-sm"
        {...props}
      />
    ),
    ...components,
  };
}
```

これでMarkdownに書いた`![alt](./images/fox.jpg)`が、最適化された`ExportedImage`として描画される。

## 出力されるHTMLの変化

`<img>`がどう変わるかを比べる。

### Before: Next.jsのデフォルト

`output: 'export'`では`unoptimized`が強制されるので、`srcset`属性がつかない。デバイスの種類を問わず1280pxサイズの画像ファイルを読み込む。

```html
<img alt="キツネの写真" src="/images/fox-4589927_1280.jpg" />
```

### After: Optimizerを使用する場合

ビルド時に各解像度のWebPが生成され、`srcset`属性のなかで`deviceSizes`に指定した`[640, 1024, 1920]`という値が使われる。これでブラウザがビューポートに合ったサイズを選んで読み込むようになる。

```html
<img
  alt="キツネの写真"
  sizes="(max-width: 800px) 100vw, 800px"
  srcset="
    /images/optimized/fox-4589927_1280-opt-640.webp   640w,
    /images/optimized/fox-4589927_1280-opt-1024.webp 1024w,
    /images/optimized/fox-4589927_1280-opt-1920.webp 1920w
  "
  src="/images/optimized/fox-4589927_1280-opt-1920.webp"
  loading="lazy"
  decoding="async"
/>
```

## まとめ

1. Makrdownフォルダ内部に画像フォルダを配置し、執筆時は相対パスで扱えるようにする
2. ビルド前に`public/images`フォルダへ画像をコピーする
3. ビルド後にコピー先フォルダのファイルをベースに最適化処理を走らせる
