---
slug: "mcp-github-proxy-1-why-and-architecture"
title: "自分用の MCP GitHub Proxy を作った話 (1) なぜ作ったか・全体構成"
date: "2026-04-18T20:05:55+09:00"
category: "Technical"
summary: "公式 GitHub Connector があるのに自前 MCP サーバーを Cloudflare Workers で立てた理由と、全体アーキテクチャ・設定モデルの設計判断について。"
---

# 自分用の MCP GitHub Proxy を作った話 (1) なぜ作ったか・全体構成

Claude.ai のチャット UI から GitHub に Issue を立てたい。コメントを書きたい。リポのファイルを読みたい。

そう思って公式の GitHub 統合を使ってみると、出来ることが想像より少ない。書き込み系は全滅。読み込みすらブラウザで開けば見える内容が取れない。それで自前の MCP サーバーを Cloudflare Workers に立てた、という話である。地味な workers.dev のエンドポイントで、現状は私一人しか繋いでいない。

全 4 回シリーズの第 1 回として、動機と全体構成について書く。

- (1) なぜ作ったか・全体構成 ← この記事
- (2) GitHub OAuth App と OAuth フロー
- (3) ガードレール詳細 (権限・identity・validators)
- (4) Codex / ChatGPT 連携時のルール整合

## なぜ自前を作ったのか

### 前提: Claude.ai における 3 つの GitHub 接続

話を進める前に、Claude.ai 周辺に存在する GitHub 接続を整理しておく。私が確認した範囲で 3 系統ある。

| 接続 | 利用面 | 出来ること |
|---|---|---|
| GitHub 統合 (公式) | Claude.ai のチャット / Project | 指定したブランチのファイルを名前と内容だけスナップショット同期 |
| GitHub App (Anthropic 製) | Claude Code Web (claude.ai/code) | 専用 GitHub プロキシと GitHub App 経由で clone / push / PR / コメント / Auto-fix まで一通り可能 |
| Custom MCP Connector | Claude.ai のチャット | 自前で立てた MCP サーバーを繋ぐ |

公式 GitHub 統合は ([Claude Help Center のドキュメント](https://support.claude.com/en/articles/10167454-using-the-github-integration) によると) ファイルの名前と内容を branch 単位で sync する仕組みで、commit 履歴や PR、その他メタデータは取得しない。書き込み系の操作はない。

Claude Code Web (claude.ai/code) では Anthropic 製の GitHub App が contents / issues / pull requests に read/write 権限を持っており、専用の GitHub プロキシと組み合わせることで push も PR 作成も Auto-fix も普通にできる。ちなみに `gh` CLI はクラウド環境のデフォルトイメージには入っておらず、必要ならセットアップスクリプトで `apt install gh` する前提になっている。いずれにせよこれは Claude Code Web の中での話で、Claude.ai のチャット UI からは触れない。

私は Claude.ai のチャット UI で作業をしたい。そこで GitHub に書き込みたい。これを満たす公式の手段は、現状ない。

### 0. WebFetch で何とかしようとしたが詰んだ

最初は素直に WebFetch で GitHub を読みに行こうとした。書き込みは諦めるとして、せめてリポのファイルくらい読めればと思ったわけだ。

結論から言うと、これも失敗する。Public リポジトリの README ですら、ヘッダのナビゲーションとフッターしか拾えない。GitHub の Web ページは JS レンダリングや動的な Markdown 生成が入っており、汎用 fetcher では本文が取れない。raw URL に書き直そうとしても、ユーザーが直接貼った URL でない限り fetcher のセーフガードに引っかかって取得できない。

ためしに `https://github.com/anthropics/claude-code/blob/main/README.md` を WebFetch で取得すると、ナビゲーションリンクと「You can't perform that action at this time.」までは取れるが、Claude Code の説明本文 (Claude Code is an agentic coding tool that lives in your terminal...) は影も形もない。

Private リポは言うまでもなく認証で弾かれる。

「Claude.ai のチャットから GitHub のリポを読みたい」「Issue や PR を立てたい」という、自分にとって最も基本的な要求が、公式の組み合わせでは満たせない。これが一番大きい動機だ。

### 1. 複数の AI エージェントを共存させたい

ベースの動機が解決したとして、その先の運用も整理しておく。

メインで Claude を使っているが、Codex CLI や ChatGPT も併用している。リポジトリには「どのエージェントが何をやったか」が後から区別できる状態で残ってほしい。コミットの trailer、Issue / PR のフッター、ラベル。エージェントごとに自動で付けたい。

### 2. ガードレールをサーバー側で強制したい

クライアント側のプロンプトでルールを書いても、長いセッションのなかで忘れられたり、無視されたりする。「`main` ブランチに直接 push しない」「`claude/` プレフィクスのブランチしか作らない」「`.github/workflows/**` は触らない」といった規律は、ツール呼び出しを受けるサーバー側で弾くのが確実だ。

### 3. ラベル運用を秩序立てたい

GitHub のラベルは、放置するとあっという間に増える。エージェントが気を利かせて `bug-fix` や `bugfix` や `🐛 bug` を勝手に作ると、ラベル体系が崩壊する。新規ラベル作成を全面的に禁止し、既存ラベルのみ使用可、未存在ラベル指定時は警告ログのみでスキップ、というルールをサーバー側で固めたい。

### 4. audit trail を残したい

「このコミットを書いたのはどのモデルか」「この Issue を立てたのは Opus か Sonnet か Codex か」が、後から見返せる状態にしたい。トレーラーやフッターでモデル名を自己申告させる仕組みを、ツール呼び出しの引数として組み込みたい。

これらすべてを満たすには、Custom MCP Connector を自前で立てるしかない。

## 全体構成

採用したスタックはこうなった。

| レイヤ | 採用 | 役割 |
|---|---|---|
| ランタイム | Cloudflare Workers | エッジで動く JS / TS ランタイム |
| ルーティング | Hono | Workers と相性のよい軽量 Web フレームワーク |
| OAuth | workers-oauth-provider | OAuth 2.1 サーバー実装ライブラリ |
| 認証元 | GitHub OAuth App | upstream の認証プロバイダ |
| トークン保管 | Workers KV | 暗号化トークンの保存先 |
| 設定配信 | `ghmcp.config.ts` を deploy 時にバンドル | KV からの動的読み込みは廃止 |
| バリデーション | Zod + 自前 validator 群 | スキーマ検証とドメイン固有のルール |

土台は Cloudflare 公式デモテンプレ `cloudflare/ai/demos/remote-mcp-github-oauth` から派生させている。`workers-oauth-provider` を使った OAuth フロー、Workers KV へのトークン暗号化保管、GitHub OAuth App とのつなぎ込みは、テンプレが既に良いところまで作ってくれていた。

そこに自分の運用ルール (ガードレール、identity システム、設定の解決ロジック) を足していった、という構造になっている。

## 技術選定の理由

### Cloudflare Workers

無料枠だけで個人利用は十分賄える。具体的には 1 日 100,000 リクエストまで無料、超過時は Error 1027 が返る仕様だ ([Cloudflare 公式ドキュメント](https://developers.cloudflare.com/workers/platform/limits/))。CPU 時間は 1 リクエストあたり 10ms までで、MCP サーバーのような GitHub API へのプロキシ用途であれば、実処理は GitHub 側で行われるため CPU 時間はほぼ消費しない。

エッジで動くので cold start も体感的に許容範囲。Anthropic 公式や Cloudflare 公式が MCP サーバーを Workers で書く例を多く出しているため、リファレンスが豊富という理由もある。

### Hono

Workers 上で動かす軽量フレームワークの定番。TypeScript first で型が効く。OAuth フロー部分は workers-oauth-provider が引き受けるので、Hono の出番は MCP エンドポイントと OAuth 関連の補助ルーティングが中心になる。

### workers-oauth-provider

公式テンプレが採用しているライブラリ。MCP サーバーを「OAuth クライアント (GitHub に対して)」かつ「OAuth サーバー (MCP クライアントである Claude.ai に対して)」として振る舞わせる二重構造を、ライブラリ側で吸収してくれる。

upstream である GitHub から受け取ったトークンを MCP クライアントに直接渡さず、Worker が自前のトークンを発行し、暗号化して KV に保管する設計だ。OAuth 周りの細かい話は次回 (第 2 回) でまとめる。

## 設定の配信モデル

設計判断として明確にしたのが、設定を動的にしないことだ。

設定は `ghmcp.config.ts` としてリポジトリに同梱し、`wrangler deploy` 時にバンドルする。KV から動的に読み込む方式は早い段階で廃止した。理由は単純で、設定の更新と deploy が分離していると、どの設定で動いているかが不透明になるからだ。

「設定を更新する = deploy する」と決めれば、git の履歴がそのまま設定変更履歴になる。`ghmcp.config.ts` を git 管理し、公開用の `ghmcp.config.example.ts` をリポジトリに置く運用に落ち着いた。

設定の解決順序は 3 段マージにしている。

```
variables.ts (VARIABLES)         ← OSS 土台として配布される不変のベースライン定数群
  ↓ 上書き
ghmcp.config.ts defaults         ← 自分の環境固有のデフォルト
  ↓ 上書き
ghmcp.config.ts repos[owner/repo] ← リポジトリ単位の上書き
```

各フィールドは「指定されていれば上書き、未指定ならフォールバック」。`commitTypes` や `branches` や `identity` のようなオブジェクトは、それぞれマージロジックで継承される。

`variables.ts` は `VARIABLES` という大きな定数オブジェクト 1 個に、Conventional Commits の type 一覧、フォールバック用テンプレート文字列、各種長さ制限、protected branches、forbidden paths といった「OSS 土台として配布される不変のベースライン値」を集約している。一方 `ghmcp.config.ts` には「個人 / 環境固有の値」(リポジトリごとの権限レベル、所有者ユーザー名、disabled tools 一覧、リポ単位の defaults 上書きなど) を書く。

定数群とユーザー設定を別ファイルに切ったのは、設定の意味が「OSS として配布される不変の土台」「自分の環境固有のデフォルト」「リポジトリ単位の例外」のどれなのかを、ファイル分離として表すためだ。

## MCP として提供する範囲

ツールは合計 18 個定義しているが、運用では 13 個のみ有効化している。残り 5 個 (`ghmcp_get_me` / `ghmcp_list_repos` / `ghmcp_search_code` / `ghmcp_list_workflow_runs` / `ghmcp_get_workflow_run_logs`) は `disabledTools` 配列で runtime 無効化、クライアントから見えないようにしている。

理由は明確で、これらは MCP 経由で触る必要がないからだ。

- 認証ユーザー情報やリポジトリ一覧はサーバー側の config で把握済み
- コード検索はローカルの ripgrep で十分
- ワークフロー実行履歴とログは GitHub UI または Claude Code / Codex の標準機能で見れば良い

「触れる範囲は狭く、その代わりガードレールは深く」という設計方針を取った。MCP 経由で出来ることが多いほど、エージェントの暴走可能性が広がる。狭く絞ることで、レビューすべきツール挙動の数を減らせる。

すべてのツールには `ghmcp_` プレフィックスを付けている。これは公式の GitHub Connector や他の MCP サーバーとツール名が衝突するのを避けるためで、運用初期にぶつかった実害から導入したルールだ。

## 次回

第 2 回では、OAuth まわりを掘り下げる。

- なぜ GitHub OAuth App を選んだのか (そして「GitHub Apps の方が向いていたのでは」という素直な反省)
- Cloudflare 公式テンプレと workers-oauth-provider が引き受けてくれること
- GitHub OAuth App のセットアップ (Homepage URL / Authorization callback URL / scope)
- KV へのトークン暗号化保管の設計

技術選定で素直に乗ったところと、後から見ると別の選択肢の方が良さそうだったところを、両方書く予定だ。