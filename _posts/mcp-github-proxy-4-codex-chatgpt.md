---
slug: "mcp-github-proxy-4-codex-chatgpt"
title: "自分用の MCP GitHub Proxy を作った話 (4) Codex / ChatGPT とのルール整合"
date: "2026-04-19T02:13:43+09:00"
category: "Technical"
summary: "シリーズ最終回。Codex CLI / Codex Web / ChatGPT それぞれの MCP 対応状況の差と、複数の AI エージェントが同じリポを触るときにルールをどう揃えているかの話。"
---

[前回](./mcp-github-proxy-3-guardrails)で、サーバー側のガードレールを4層に分けて書いた。今回はシリーズ最終回として、Claude以外のエージェントとの共存をどうしているかを書く。

- (1) なぜ作ったか・全体構成
- (2) GitHub OAuth AppとOAuthフロー
- (3) ガードレールの考え方
- (4) Codex/ChatGPTとのルール整合 ← この記事

## 状況: 3つのエージェントが同じリポを触る

私はメインでClaudeを使うが、Codex CLIとChatGPTも併用する。同じリポに対して、3つのエージェントから別々にIssueが立ち、PRが出され、コメントが付く。

これを「カオスにしない」のがこの記事のテーマだ。

各エージェントのMCP対応状況は揃っていない。同じ規律をMCPサーバー側だけで強制することが出来ないので、**MCPで出来るところはMCPで、出来ないところはエージェント側のメモリやプロンプトで揃える**ハイブリッドな方針になる。

## MCP対応状況の現在地 (2026年4月時点)

| エージェント | カスタムMCP接続 | 備考 |
| ------------------------------------- | --------------- | --------------------------------------------------- |
| Claude.ai (チャット) | ○ | このMCP Proxyが繋がっている前提 |
| Claude Code Web | ─ | 専用GitHubプロキシ + GitHub Appで別経路 (第1回参照) |
| Codex CLI | ○ | ローカルからMCPサーバー追加可能 |
| Codex Web | ✕ | 現状MCP非対応 (本人申告ベース) |
| ChatGPT (Plus / Pro) | △ | developer modeで限定的に対応 |
| ChatGPT (Business / Enterprise / Edu) | ○ | developer mode経由でfull MCP対応 (beta) |

ChatGPT側の状況についてはOpenAIの公式ヘルプ ([Developer mode and full MCP connectors in ChatGPT [beta]](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta)) に詳しい。リモートMCPサーバーのみ対応、SSE/streaming HTTPプロトコル、OAuth認証対応、書き込みアクションには確認モーダルが出る、といった具合だ。

私の運用では、現状ChatGPT本体にMCPは繋いでいない。後述するルールセットをGPTメモリで仕込み、ChatGPTがGitHubに対して何かするときは「私が手動でIssueやPRを立てるための文面を整えてもらう」という形にしている。Codex Webも同様で、ブラウザUI経由で動く範囲ではMCPの出る幕がない。

つまり**実質的にMCP Proxyを直接叩いているのはClaude.aiとCodex CLIの2つ**ということになる。

## 規律をどこで強制するか: 3つの層

ルール整合は、おおむね3つの層で考えている。

| 層 | 強制方法 | 効く相手 |
| -------------------- | --------------------------------------- | ------------------------------------------------------------ |
| MCPサーバー層 | サーバー側validator (第3回) | MCPを叩いてくる全クライアント |
| エージェントメモリ層 | GPTメモリ / Claude.aiのプロジェクト指示 | そのエージェントが起こす全アクション (MCP経由かどうか問わず) |
| 人手の最終確認層 | コミット前の私のレビュー | 書き込み系アクションの最後の砦 |

理想はMCPサーバー層だけで完結することだが、Codex WebやChatGPTのようにMCPを叩かない経路では、エージェントメモリ層に同じルールを別実装で持たせるしかない。

## エージェントメモリ層: 同じルールを別言語で書く

ChatGPT (Codex Web含む) のGPTメモリには、Issue/PR生成ルールを英語で仕込んでいる。

```text
Has a preferred GitHub Issue/PR generation rule set:
strict format (<emoji> <type>: <summary>),
exactly one blank line between title and body,
title <=100 chars (rewrite if too long),
body <=10000 chars,
required GitMoji prefixes
(🎉 init, ✨ feat, 🛠️ fix, ♻️ refactor, 🚀 perf,
 🧪 test, 💄 style, 📝 docs, 🧹 chore, 🚧 wip),
exactly one bot label (bot/OpenAI/ChatGPT or bot/OpenAI/Codex Web),
project label inferred as project/<repo-name> with exceptions
(kazaminn/kz-pfblog→project/tech-blog,
 kazaminn/tck-psn→project/task-cooker-private),
sprint label computed in JST using base 2026-01-05,
14-day intervals, sprint = floor((date-base)/14)+1,
valid v1–v26,
only allowed labels may be used, no new labels,
fix violations before submission.
```

これをClaude側MCP Proxyのサーバー側validatorと並べると、ほとんど同じ規約をしゃべっていることがわかる。

- titleフォーマット: 両者とも`<type>: <summary>`形式、長さ制限同じ (100字/10000字)
- GitMoji prefix: emoji 10種類が両者で一致
- 新規ラベル禁止: 両者で一致
- Sprint番号計算: 基準日2026-01-05、14日刻み、v1〜v26、JST。両者で一致

差分は次の2点だけ。

1. botラベル: Claude経由は`bot/Anthropic/ClaudeAI`、ChatGPT/Codex Web経由は`bot/OpenAI/ChatGPT`または`bot/OpenAI/Codex Web`
2. projectラベル: ChatGPT側は`project/<repo-name>`を自動推論し、例外マッピングをGPTメモリに持つ。Claude側MCP Proxyは「既存ラベルのみ使用、新規作成禁止」で、推論は行わずクライアント側で適切な既存ラベルを指定させる

botラベルでエージェントを区別することで、後から「このPRはどのエージェントが立てたか」が一目でわかる。`bot/*`のフィルタをかければエージェント単位の作業履歴が抽出できる。

## ラベル管理の方針: 新規作成は人間だけ

両エージェントで一致させているルールのうち、特に重要なのが新規ラベル作成の全面禁止だ。

GitHubのラベルは、エージェントに自由を許すと数日で破綻する。`bug-fix`/`bugfix`/`🐛 bug`/`Bug`が並ぶ。粒度の異なる`frontend`、`ui`、`web`が混在する。一度発生した表記ゆれを後から統合するのは、想像より遥かに重い作業だ。

なので、エージェントは既存ラベルから選ぶだけ。指定したラベルが存在しない場合、Claude側MCP Proxyでは警告ログを残してスキップする (Issue作成自体は通す)。ChatGPT側はGPTメモリのルールで「違反があったらsubmission前に修正する」よう指示している。

「人間が新規作成、エージェントは選ぶだけ」という非対称性が、ラベル体系の秩序を保つ最低限の条件だと考えている。

## sprint番号の同一計算式

地味に効いているのが、Sprint番号を両エージェントで**同じ計算式**にしている点だ。

- 基準日: 2026-01-05 (JST)
- 周期: 14日
- 計算: `sprint = floor((date - base) / 14) + 1`
- 有効範囲: v1〜v26 (2027-01-03まで)

Claude側MCP Proxyのコードと、ChatGPT側GPTメモリの記述で、この計算式が一字一句揃っている。これがズレると同じ日に立てたIssueが`sprint-v8`と`sprint-v9`に分かれて記録され、後から進捗を集計するときに困る。

## まとめ: ルールはあるが、強制経路は揃わない

シリーズを通じて書いてきたことを4回分まとめる。

- (1) Claude.aiのチャットからGitHubに書き込む手段が公式には無いので自前MCP Proxyを立てた
- (2) Cloudflare Workers + workers-oauth-provider + GitHub OAuth App。OAuth Appは権限が粗いのでサーバー側で絞る方針に倒した
- (3) ガードレールはツール/リポジトリ/ブランチ/ファイル/identity/validatorの6系統。「届かないものは安全」と「規律は中間のサーバーで保証」の2つの考え方が中心
- (4) MCPを叩けないエージェント (ChatGPT/Codex Web) にはGPTメモリで同じルールを別実装する。Claude側との差分はbotラベルとprojectラベル推論の有無だけ

複数のエージェントが同じリポを触る運用は、現状の各社MCP対応状況だと「全部MCPで揃える」が成立しない。**サーバー側で強制できるところはサーバーで、できないところはエージェントメモリで、最後は人手で**、という三段構えで運用している。

このシリーズで書いた仕組みは、まだ私一人しか繋いでいない自分用のサーバーだ。誰かが同じことをやりたくなった時の参考になれば幸いだ。
