---
slug: "mcp-github-proxy-1-why-and-architecture"
title: "自分用の MCP GitHub Proxy を作った話 (1) なぜ作ったか・全体構成"
date: "2026-04-18T20:05:55+09:00"
category: "Technical"
summary: "公式 GitHub Connector があるのに自前 MCP サーバーを Cloudflare Workers で立てた理由と、全体アーキテクチャ・設定モデルの設計判断について。"
---

# 自分用のMCP GitHub Proxyを作った話 (1) なぜ作ったか・全体構成

Claude.aiのチャットUIからGitHubにIssueを立てたい。コメントを書きたい。リポのファイルを読みたい。

そう思って公式のGitHub統合を使ってみると、出来ることが想像より少ない。書き込み系は全滅。読み込みすらブラウザで開けば見える内容が取れない。それで自前のMCPサーバーをCloudflare Workersに立てた、という話である。地味なworkers.devのエンドポイントで、現状は私一人しか繋いでいない。

全4回シリーズの第1回として、動機と全体構成について書く。

- (1) なぜ作ったか・全体構成 ← この記事
- (2) GitHub OAuth AppとOAuthフロー
- (3) ガードレール詳細 (権限・identity・validators)
- (4) Codex/ChatGPT連携時のルール整合

## なぜ自前を作ったのか

### 前提: Claude.aiにおける3つのGitHub接続

話を進める前に、Claude.ai周辺に存在するGitHub接続を整理しておく。私が確認した範囲で3系統ある。

| 接続 | 利用面 | 出来ること |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| GitHub統合 (公式) | Claude.aiのチャット / Project | 指定したブランチのファイルを名前と内容だけスナップショット同期 |
| GitHub App (Anthropic製) | Claude Code Web (claude.ai/code) | 専用GitHubプロキシとGitHub App経由でclone / push / PR / コメント / Auto-fixまで一通り可能 |
| Custom MCP Connector | Claude.aiのチャット | 自前で立てたMCPサーバーを繋ぐ |

公式GitHub統合は ([Claude Help Centerのドキュメント](https://support.claude.com/en/articles/10167454-using-the-github-integration)によると) ファイルの名前と内容をbranch単位でsyncする仕組みで、commit履歴やPR、その他メタデータは取得しない。書き込み系の操作はない。

Claude Code Web (claude.ai/code) ではAnthropic製のGitHub Appがcontents/issues/pull requestsにread/write権限を持っており、専用のGitHubプロキシと組み合わせることでpushもPR作成もAuto-fixも普通にできる。ちなみに`gh` CLIはクラウド環境のデフォルトイメージには入っておらず、必要ならセットアップスクリプトで`apt install gh`する前提になっている。いずれにせよこれはClaude Code Webの中での話で、Claude.aiのチャットUIからは触れない。

私はClaude.aiのチャットUIで作業をしたい。そこでGitHubに書き込みたい。これを満たす公式の手段は、現状ない。

### 0. WebFetchで何とかしようとしたが詰んだ

最初は素直にWebFetchでGitHubを読みに行こうとした。書き込みは諦めるとして、せめてリポのファイルくらい読めればと思ったわけだ。

結論から言うと、これも失敗する。PublicリポジトリのREADMEですら、ヘッダのナビゲーションとフッターしか拾えない。GitHubのWebページはJSレンダリングや動的なMarkdown生成が入っており、汎用fetcherでは本文が取れない。raw URLに書き直そうとしても、ユーザーが直接貼ったURLでない限りfetcherのセーフガードに引っかかって取得できない。

ためしに`https://github.com/anthropics/claude-code/blob/main/README.md`をWebFetchで取得すると、ナビゲーションリンクと「You can't perform that action at this time.」までは取れるが、Claude Codeの説明本文 (Claude Code is an agentic coding tool that lives in your terminal...) は影も形もない。

Privateリポは言うまでもなく認証で弾かれる。

「Claude.aiのチャットからGitHubのリポを読みたい」「IssueやPRを立てたい」という、自分にとって最も基本的な要求が、公式の組み合わせでは満たせない。これが一番大きい動機だ。

### 1. 複数のAIエージェントを共存させたい

ベースの動機が解決したとして、その先の運用も整理しておく。

メインでClaudeを使っているが、Codex CLIやChatGPTも併用している。リポジトリには「どのエージェントが何をやったか」が後から区別できる状態で残ってほしい。コミットのtrailer、Issue/PRのフッター、ラベル。エージェントごとに自動で付けたい。

### 2. ガードレールをサーバー側で強制したい

クライアント側のプロンプトでルールを書いても、長いセッションのなかで忘れられたり、無視されたりする。「`main`ブランチに直接pushしない」「`claude/`プレフィクスのブランチしか作らない」「`.github/workflows/**`は触らない」といった規律は、ツール呼び出しを受けるサーバー側で弾くのが確実だ。

### 3. ラベル運用を秩序立てたい

GitHubのラベルは、放置するとあっという間に増える。エージェントが気を利かせて`bug-fix`や`bugfix`や`🐛 bug`を勝手に作ると、ラベル体系が崩壊する。新規ラベル作成を全面的に禁止し、既存ラベルのみ使用可、未存在ラベル指定時は警告ログのみでスキップ、というルールをサーバー側で固めたい。

### 4. audit trailを残したい

「このコミットを書いたのはどのモデルか」「このIssueを立てたのはOpusかSonnetかCodexか」が、後から見返せる状態にしたい。トレーラーやフッターでモデル名を自己申告させる仕組みを、ツール呼び出しの引数として組み込みたい。

これらすべてを満たすには、Custom MCP Connectorを自前で立てるしかない。

## 全体構成

採用したスタックはこうなった。

| レイヤ | 採用 | 役割 |
| -------------- | ---------------------------------------- | ------------------------------------------- |
| ランタイム | Cloudflare Workers | エッジで動くJS / TSランタイム |
| ルーティング | Hono | Workersと相性のよい軽量Webフレームワーク |
| OAuth | workers-oauth-provider | OAuth 2.1サーバー実装ライブラリ |
| 認証元 | GitHub OAuth App | upstreamの認証プロバイダ |
| トークン保管 | Workers KV | 暗号化トークンの保存先 |
| 設定配信 | `ghmcp.config.ts`をdeploy時にバンドル | KVからの動的読み込みは廃止 |
| バリデーション | Zod + 自前validator群 | スキーマ検証とドメイン固有のルール |

土台はCloudflare公式デモテンプレ`cloudflare/ai/demos/remote-mcp-github-oauth`から派生させている。`workers-oauth-provider`を使ったOAuthフロー、Workers KVへのトークン暗号化保管、GitHub OAuth Appとのつなぎ込みは、テンプレが既に良いところまで作ってくれていた。

そこに自分の運用ルール (ガードレール、identityシステム、設定の解決ロジック) を足していった、という構造になっている。

## 技術選定の理由

### Cloudflare Workers

無料枠だけで個人利用は十分賄える。具体的には1日100,000リクエストまで無料、超過時はError 1027が返る仕様だ ([Cloudflare公式ドキュメント](https://developers.cloudflare.com/workers/platform/limits/))。CPU時間は1リクエストあたり10msまでで、MCPサーバーのようなGitHub APIへのプロキシ用途であれば、実処理はGitHub側で行われるためCPU時間はほぼ消費しない。

エッジで動くのでcold startも体感的に許容範囲。Anthropic公式やCloudflare公式がMCPサーバーをWorkersで書く例を多く出しているため、リファレンスが豊富という理由もある。

### Hono

Workers上で動かす軽量フレームワークの定番。TypeScript firstで型が効く。OAuthフロー部分はworkers-oauth-providerが引き受けるので、Honoの出番はMCPエンドポイントとOAuth関連の補助ルーティングが中心になる。

### workers-oauth-provider

公式テンプレが採用しているライブラリ。MCPサーバーを「OAuthクライアント (GitHubに対して)」かつ「OAuthサーバー (MCPクライアントであるClaude.aiに対して)」として振る舞わせる二重構造を、ライブラリ側で吸収してくれる。

upstreamであるGitHubから受け取ったトークンをMCPクライアントに直接渡さず、Workerが自前のトークンを発行し、暗号化してKVに保管する設計だ。OAuth周りの細かい話は次回 (第2回) でまとめる。

## 設定の配信モデル

設計判断として明確にしたのが、設定を動的にしないことだ。

設定は`ghmcp.config.ts`としてリポジトリに同梱し、`wrangler deploy`時にバンドルする。KVから動的に読み込む方式は早い段階で廃止した。理由は単純で、設定の更新とdeployが分離していると、どの設定で動いているかが不透明になるからだ。

「設定を更新する = deployする」と決めれば、gitの履歴がそのまま設定変更履歴になる。`ghmcp.config.ts`をgit管理し、公開用の`ghmcp.config.example.ts`をリポジトリに置く運用に落ち着いた。

設定の解決順序は3段マージにしている。

```
variables.ts (VARIABLES)         ← OSS 土台として配布される不変のベースライン定数群
  ↓ 上書き
ghmcp.config.ts defaults         ← 自分の環境固有のデフォルト
  ↓ 上書き
ghmcp.config.ts repos[owner/repo] ← リポジトリ単位の上書き
```

各フィールドは「指定されていれば上書き、未指定ならフォールバック」。`commitTypes`や`branches`や`identity`のようなオブジェクトは、それぞれマージロジックで継承される。

`variables.ts`は`VARIABLES`という大きな定数オブジェクト1個に、Conventional Commitsのtype一覧、フォールバック用テンプレート文字列、各種長さ制限、protected branches、forbidden pathsといった「OSS土台として配布される不変のベースライン値」を集約している。一方`ghmcp.config.ts`には「個人/環境固有の値」(リポジトリごとの権限レベル、所有者ユーザー名、disabled tools一覧、リポ単位のdefaults上書きなど) を書く。

定数群とユーザー設定を別ファイルに切ったのは、設定の意味が「OSSとして配布される不変の土台」「自分の環境固有のデフォルト」「リポジトリ単位の例外」のどれなのかを、ファイル分離として表すためだ。

## MCPとして提供する範囲

ツールは合計18個定義しているが、運用では13個のみ有効化している。残り5個 (`ghmcp_get_me`/`ghmcp_list_repos`/`ghmcp_search_code`/`ghmcp_list_workflow_runs`/`ghmcp_get_workflow_run_logs`) は`disabledTools`配列でruntime無効化、クライアントから見えないようにしている。

理由は明確で、これらはMCP経由で触る必要がないからだ。

- 認証ユーザー情報やリポジトリ一覧はサーバー側のconfigで把握済み
- コード検索はローカルのripgrepで十分
- ワークフロー実行履歴とログはGitHub UIまたはClaude Code/Codexの標準機能で見れば良い

「触れる範囲は狭く、その代わりガードレールは深く」という設計方針を取った。MCP経由で出来ることが多いほど、エージェントの暴走可能性が広がる。狭く絞ることで、レビューすべきツール挙動の数を減らせる。

すべてのツールには`ghmcp_`プレフィックスを付けている。これは公式のGitHub Connectorや他のMCPサーバーとツール名が衝突するのを避けるためで、運用初期にぶつかった実害から導入したルールだ。

## 次回

第2回では、OAuthまわりを掘り下げる。

- なぜGitHub OAuth Appを選んだのか (そして「GitHub Appsの方が向いていたのでは」という素直な反省)
- Cloudflare公式テンプレとworkers-oauth-providerが引き受けてくれること
- GitHub OAuth Appのセットアップ (Homepage URL/Authorization callback URL/scope)
- KVへのトークン暗号化保管の設計

技術選定で素直に乗ったところと、後から見ると別の選択肢の方が良さそうだったところを、両方書く予定だ。
