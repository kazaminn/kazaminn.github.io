---
slug: "mcp-github-proxy-2-oauth"
title: "自分用の MCP GitHub Proxy を作った話 (2) GitHub OAuth App と OAuth フロー"
date: "2026-04-18T20:40:59+09:00"
category: "Technical"
summary: "Cloudflare Workers 上で GitHub OAuth App を使って MCP サーバーを動かす実装の OAuth まわり。なぜ OAuth App を選び、GitHub Apps の方が向いていたと反省するに至ったかまで。"
---

# 自分用のMCP GitHub Proxyを作った話 (2) GitHub OAuth AppとOAuthフロー

[前回](./mcp-github-proxy-1-why-and-architecture)は「なぜ自前のMCP GitHub Proxyを作ったのか」「全体構成」まで書いた。今回はOAuthまわりを掘り下げる。

- (1) なぜ作ったか・全体構成
- (2) GitHub OAuth AppとOAuthフロー ← この記事
- (3) ガードレール詳細 (権限・identity・validators)
- (4) Codex/ChatGPT連携時のルール整合

## GitHub OAuth Appを選んだ理由 (と反省)

シンプルにCloudflare公式テンプレ`cloudflare/ai/demos/remote-mcp-github-oauth`のボイラープレートを使ったので、OAuth App前提で作った。ただOAuth Appは`repo` scopeを要求した時点でreadもwriteも両方ついてくる仕様で、権限が粗い。そこで「アプリ側で独自にパーミッション管理を組み込む」方針で進めた。第3回で書く「3-tier permission」や「branch-level permission」はこの制約の裏返しで生まれた設計だ。

後でGitHub公式ドキュメント ([Differences between GitHub Apps and OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)) を読んだら、権限を細かく絞れる (fine-grained permissions) GitHub Appsの方が向いている、とGitHub自身がはっきり書いていた。今からやり直すならGitHub Appsだ。動いているものを差し替えるROIは今のところ見えていない。

## workers-oauth-providerが引き受けてくれること

OAuthまわりを自分で書き切るのはつらい。幸いCloudflareがOSSで出している[workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)が、重い部分をほぼ全部引き受けてくれる。

このライブラリが面白いのは、**MCPサーバーを「OAuthクライアントかつOAuthサーバー」の二重構造として扱う**点だ。

```
[Claude.ai (MCP client)]
    ↕  OAuth 2.1 (Worker が server 役)
[MCP GitHub Proxy (Cloudflare Worker)]
    ↕  OAuth 2.0 (Worker が client 役)
[GitHub (OAuth App)]
```

上側ではWorkerがOAuth 2.1サーバーとして振る舞い、Claude.aiからの接続を受ける。下側ではWorkerがOAuthクライアントとしてGitHubに対して認可を要求する。この二役を1つのWorkerプロセスが同時に演じる。

ライブラリは次のことを自動でやってくれる。

- 上側 (Claude.ai向け): OAuth 2.1エンドポイントの提供、CSRFトークン検証、認可コード発行、client token管理
- 下側 (GitHub向け): authorization code grantの実装、token交換、stateパラメータ検証
- 二役の接続: GitHubから受け取ったtokenをMCP clientに**直接は渡さず**、Workerが自前の短命tokenを発行して対応付けをKVに保管

一番大事なのは最後の点だ。GitHubの生トークンをClaude.aiに渡すと、Anthropic側のログや通信経路に生トークンが流れる可能性が出る。そうしない設計になっているおかげで、漏れたとしても被害範囲がWorkerの自前トークンで留まる。

## GitHub OAuth Appセットアップ

ここから先は実務の備忘録。

### OAuth Appを登録する

[github.com/settings/developers](https://github.com/settings/developers)の**OAuth Apps**からNew OAuth Appで登録する。入れる項目：

- **Application name**: 何でも良い
- **Homepage URL**: Cloudflare Workersのデプロイ先URL (例: `https://<worker-name>.<account>.workers.dev`)
- **Authorization callback URL**: 上記のURLに`/callback`を足したもの (例: `https://<worker-name>.<account>.workers.dev/callback`)

登録するとClient IDが発行され、そこからClient Secretを生成する。この2つを後でwranglerに渡す。

### scopeの設計

scopeは`repo`を選択する。理由は前述のとおりで、GitHub側にread-onlyの選択肢がない以上、privateリポまで含めた書き込み権限を取らざるを得ない。

scopeはauthorizeエンドポイントのクエリパラメータで指定する。

```
https://github.com/login/oauth/authorize?client_id=...&scope=repo
```

publicリポのみで良ければ`public_repo` scopeで済むが、privateリポで`ghmcp_get_file_content`を叩きたいケースが必ず出てくるので、割り切って`repo`で取っている。広い権限を取った分の制約はサーバー側で塞ぐ。

### wrangler secretでClient ID / Secret / Cookie encryption keyを登録する

Worker側で必要になるシークレットは3つ。

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

`COOKIE_ENCRYPTION_KEY`はworkers-oauth-providerがsession cookieを暗号化するのに使う。適当な文字列ではなく、ちゃんとしたランダムなバイト列にする。

### KV namespaceを作る

トークンの保管先としてKV namespaceを1つ作っておく。

```bash
npx wrangler kv namespace create "OAUTH_KV"
```

表示されたKV namespace IDを`wrangler.jsonc`のbindingsに書く。

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

これでworkers-oauth-providerが`env.OAUTH_KV`経由で読み書きできるようになる。

## OAuthフローの流れ

実際にユーザーがClaude.aiからMCPサーバーに初接続したときの流れを追うとこうなる。

1. **Claude.aiがWorkerに接続試行**: Claude.ai側でCustom MCP ConnectorにURLを登録すると、Claude.aiがWorkerのMCPエンドポイントにアクセスする
2. **Workerが認可を要求**: workers-oauth-providerが「OAuthが必要」と判断し、Claude.aiにログイン画面 (Workerが提供する認可同意ページ) を見せる
3. **ユーザーがGitHub認可へ**: 同意ページで許可すると、WorkerがGitHubのauthorizeエンドポイントにリダイレクトする
4. **GitHubで認可**: ユーザーがGitHubのページでscope (`repo`) を確認し、Authorizeボタンを押す
5. **GitHubが`/callback`にcode付きでリダイレクト**: Workerは受け取った認可コードをGitHubのtokenエンドポイントでaccess tokenに交換する
6. **Workerが自前tokenを発行してClaude.aiに返す**: GitHubから受け取ったaccess tokenはWorker内でKVに暗号化保管し、Claude.aiには別途発行した短命tokenを返す
7. **以降、Claude.aiは自前tokenを使ってWorkerにツール呼び出しをする**: Workerはリクエストを受けるたびに自前tokenを検証し、対応するGitHub access tokenをKVから取り出してGitHub APIを叩く

workers-oauth-providerのおかげで、自分で書かないといけないのは6と7の「ツール呼び出し時にGitHub APIを叩く部分」だけになる。

## KVへのトークン暗号化保管の設計

KVに保管するものは次の2層に分かれる。

| 層 | キー | 値 | 用途 |
| ------------- | ------------------------------------ | ---------------------------------------------------------------- | ------------------------------- |
| MCP client側 | Worker発行の自前token (のハッシュ) | client metadata + GitHub access tokenへの参照 | Claude.aiからのリクエスト認証 |
| GitHub側 | session / oauth state用キー | GitHub access token (暗号化済み) + login / email等のuser props | WorkerがGitHub APIを叩くとき |

この二層構造があることで、**GitHubの生トークンがMCP client側に渡らない**設計が成立している。Claude.ai側で万一何かログが残ったとしても、それはWorkerが発行した自前tokenであって、GitHubの生トークンではない。

Worker側が漏れたら終わりじゃないか、という話は当然あるが、そこはCloudflare Workersの実行環境 (isolate単位の分離、secrets管理) とKVの暗号化保管に信頼を置いている。完全な多重防御にはならないが、**層を増やすことで漏洩時の影響範囲を狭めている**、という位置付けになる。

## 次回

第3回ではガードレールの詳細に踏み込む。

- 3-tier permission (read/issues/full) の設計
- ブランチ単位の権限 (globマッチ、first match wins)
- identity system (commit/issue/PR/commentのテンプレート展開)
- validators (タイトル形式、commit message、ファイルパス)
- disabled toolsとcommitTypesのリポジトリ単位上書き

OAuth側で粗く取ってきた権限を、サーバー側でどう絞り込んでいるか、という話になる。
