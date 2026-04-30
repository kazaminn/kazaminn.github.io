---
slug: "mcp-github-proxy-2-oauth"
title: "自分用の MCP GitHub Proxy を作った話 (2) GitHub OAuth App と OAuth フロー"
date: "2026-04-18T20:40:59+09:00"
category: "Technical"
summary: "Cloudflare Workers 上で GitHub OAuth App を使って MCP サーバーを動かす実装の OAuth まわり。なぜ OAuth App を選び、GitHub Apps の方が向いていたと反省するに至ったかまで。"
---

# 自分用の MCP GitHub Proxy を作った話 (2) GitHub OAuth App と OAuth フロー

[前回](./mcp-github-proxy-1-why-and-architecture) は「なぜ自前の MCP GitHub Proxy を作ったのか」「全体構成」まで書いた。今回は OAuth まわりを掘り下げる。

- (1) なぜ作ったか・全体構成
- (2) GitHub OAuth App と OAuth フロー ← この記事
- (3) ガードレール詳細 (権限・identity・validators)
- (4) Codex / ChatGPT 連携時のルール整合

## GitHub OAuth App を選んだ理由 (と反省)

シンプルに Cloudflare 公式テンプレ `cloudflare/ai/demos/remote-mcp-github-oauth` のボイラープレートを使ったので、OAuth App 前提で作った。ただ OAuth App は `repo` scope を要求した時点で read も write も両方ついてくる仕様で、権限が粗い。そこで「アプリ側で独自にパーミッション管理を組み込む」方針で進めた。第 3 回で書く「3-tier permission」や「branch-level permission」はこの制約の裏返しで生まれた設計だ。

後で GitHub 公式ドキュメント ([Differences between GitHub Apps and OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)) を読んだら、権限を細かく絞れる (fine-grained permissions) GitHub Apps の方が向いている、と GitHub 自身がはっきり書いていた。今からやり直すなら GitHub Apps だ。動いているものを差し替える ROI は今のところ見えていない。

## workers-oauth-provider が引き受けてくれること

OAuth まわりを自分で書き切るのはつらい。幸い Cloudflare が OSS で出している [workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider) が、重い部分をほぼ全部引き受けてくれる。

このライブラリが面白いのは、**MCP サーバーを「OAuth クライアントかつ OAuth サーバー」の二重構造として扱う**点だ。

```
[Claude.ai (MCP client)]
    ↕  OAuth 2.1 (Worker が server 役)
[MCP GitHub Proxy (Cloudflare Worker)]
    ↕  OAuth 2.0 (Worker が client 役)
[GitHub (OAuth App)]
```

上側では Worker が OAuth 2.1 サーバーとして振る舞い、Claude.ai からの接続を受ける。下側では Worker が OAuth クライアントとして GitHub に対して認可を要求する。この二役を 1 つの Worker プロセスが同時に演じる。

ライブラリは次のことを自動でやってくれる。

- 上側 (Claude.ai 向け): OAuth 2.1 エンドポイントの提供、CSRF トークン検証、認可コード発行、client token 管理
- 下側 (GitHub 向け): authorization code grant の実装、token 交換、state パラメータ検証
- 二役の接続: GitHub から受け取った token を MCP client に**直接は渡さず**、Worker が自前の短命 token を発行して対応付けを KV に保管

一番大事なのは最後の点だ。GitHub の生トークンを Claude.ai に渡すと、Anthropic 側のログや通信経路に生トークンが流れる可能性が出る。そうしない設計になっているおかげで、漏れたとしても被害範囲が Worker の自前トークンで留まる。

## GitHub OAuth App セットアップ

ここから先は実務の備忘録。

### OAuth App を登録する

[github.com/settings/developers](https://github.com/settings/developers) の **OAuth Apps** から New OAuth App で登録する。入れる項目：

- **Application name**: 何でも良い
- **Homepage URL**: Cloudflare Workers のデプロイ先 URL (例: `https://<worker-name>.<account>.workers.dev`)
- **Authorization callback URL**: 上記の URL に `/callback` を足したもの (例: `https://<worker-name>.<account>.workers.dev/callback`)

登録すると Client ID が発行され、そこから Client Secret を生成する。この 2 つを後で wrangler に渡す。

### scope の設計

scope は`repo`を選択する。理由は前述のとおりで、GitHub 側に read-only の選択肢がない以上、private リポまで含めた書き込み権限を取らざるを得ない。

scope は authorize エンドポイントのクエリパラメータで指定する。

```
https://github.com/login/oauth/authorize?client_id=...&scope=repo
```

public リポのみで良ければ `public_repo` scope で済むが、private リポで `ghmcp_get_file_content` を叩きたいケースが必ず出てくるので、割り切って `repo` で取っている。広い権限を取った分の制約はサーバー側で塞ぐ。

### wrangler secret で Client ID / Secret / Cookie encryption key を登録する

Worker 側で必要になるシークレットは 3 つ。

```bash
npx wrangler secret put GITHUB_CLIENT_ID
# プロンプトで Client ID を入力

npx wrangler secret put GITHUB_CLIENT_SECRET
# プロンプトで Client Secret を入力

npx wrangler secret put COOKIE_ENCRYPTION_KEY
# 32 バイトのランダム文字列を入れる。例:
#   openssl rand -hex 32
# の出力を貼り付ける
```

`COOKIE_ENCRYPTION_KEY` は workers-oauth-provider が session cookie を暗号化するのに使う。適当な文字列ではなく、ちゃんとしたランダムなバイト列にする。

### KV namespace を作る

トークンの保管先として KV namespace を 1 つ作っておく。

```bash
npx wrangler kv namespace create "OAUTH_KV"
```

表示された KV namespace ID を `wrangler.jsonc` の bindings に書く。

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "OAUTH_KV",
      "id": "<namespace id>",
    },
  ],
}
```

これで workers-oauth-provider が `env.OAUTH_KV` 経由で読み書きできるようになる。

## OAuth フローの流れ

実際にユーザーが Claude.ai から MCP サーバーに初接続したときの流れを追うとこうなる。

1. **Claude.ai が Worker に接続試行**: Claude.ai 側で Custom MCP Connector に URL を登録すると、Claude.ai が Worker の MCP エンドポイントにアクセスする
2. **Worker が認可を要求**: workers-oauth-provider が「OAuth が必要」と判断し、Claude.ai にログイン画面 (Worker が提供する認可同意ページ) を見せる
3. **ユーザーが GitHub 認可へ**: 同意ページで許可すると、Worker が GitHub の authorize エンドポイントにリダイレクトする
4. **GitHub で認可**: ユーザーが GitHub のページで scope (`repo`) を確認し、Authorize ボタンを押す
5. **GitHub が `/callback` に code 付きでリダイレクト**: Worker は受け取った認可コードを GitHub の token エンドポイントで access token に交換する
6. **Worker が自前 token を発行して Claude.ai に返す**: GitHub から受け取った access token は Worker 内で KV に暗号化保管し、Claude.ai には別途発行した短命 token を返す
7. **以降、Claude.ai は自前 token を使って Worker にツール呼び出しをする**: Worker はリクエストを受けるたびに自前 token を検証し、対応する GitHub access token を KV から取り出して GitHub API を叩く

workers-oauth-provider のおかげで、自分で書かないといけないのは 6 と 7 の「ツール呼び出し時に GitHub API を叩く部分」だけになる。

## KV へのトークン暗号化保管の設計

KV に保管するものは次の 2 層に分かれる。

| 層            | キー                                 | 値                                                               | 用途                            |
| ------------- | ------------------------------------ | ---------------------------------------------------------------- | ------------------------------- |
| MCP client 側 | Worker 発行の自前 token (のハッシュ) | client metadata + GitHub access token への参照                   | Claude.ai からのリクエスト認証  |
| GitHub 側     | session / oauth state 用キー         | GitHub access token (暗号化済み) + login / email 等の user props | Worker が GitHub API を叩くとき |

この二層構造があることで、**GitHub の生トークンが MCP client 側に渡らない**設計が成立している。Claude.ai 側で万一何かログが残ったとしても、それは Worker が発行した自前 token であって、GitHub の生トークンではない。

Worker 側が漏れたら終わりじゃないか、という話は当然あるが、そこは Cloudflare Workers の実行環境 (isolate 単位の分離、secrets 管理) と KV の暗号化保管に信頼を置いている。完全な多重防御にはならないが、**層を増やすことで漏洩時の影響範囲を狭めている**、という位置付けになる。

## 次回

第 3 回ではガードレールの詳細に踏み込む。

- 3-tier permission (read / issues / full) の設計
- ブランチ単位の権限 (glob マッチ、first match wins)
- identity system (commit / issue / PR / comment のテンプレート展開)
- validators (タイトル形式、commit message、ファイルパス)
- disabled tools と commitTypes のリポジトリ単位上書き

OAuth 側で粗く取ってきた権限を、サーバー側でどう絞り込んでいるか、という話になる。
