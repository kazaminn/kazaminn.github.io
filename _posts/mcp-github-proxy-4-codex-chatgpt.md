---
slug: "mcp-github-proxy-4-codex-chatgpt"
title: "自分用の MCP GitHub Proxy を作った話 (4) Codex / ChatGPT とのルール整合"
date: "2026-04-19T02:13:43+09:00"
category: "Technical"
summary: "シリーズ最終回。Codex CLI / Codex Web / ChatGPT それぞれの MCP 対応状況の差と、複数の AI エージェントが同じリポを触るときにルールをどう揃えているかの話。"
---

# 自分用の MCP GitHub Proxy を作った話 (4) Codex / ChatGPT とのルール整合

[前回](./mcp-github-proxy-3-guardrails) で、サーバー側のガードレールを 4 層に分けて書いた。今回はシリーズ最終回として、Claude 以外のエージェントとの共存をどうしているかを書く。

- (1) なぜ作ったか・全体構成
- (2) GitHub OAuth App と OAuth フロー
- (3) ガードレールの考え方
- (4) Codex / ChatGPT とのルール整合 ← この記事

## 状況: 3 つのエージェントが同じリポを触る

私はメインで Claude を使うが、Codex CLI と ChatGPT も併用する。同じリポに対して、3 つのエージェントから別々に Issue が立ち、PR が出され、コメントが付く。

これを「カオスにしない」のがこの記事のテーマだ。

各エージェントの MCP 対応状況は揃っていない。同じ規律を MCP サーバー側だけで強制することが出来ないので、**MCP で出来るところは MCP で、出来ないところはエージェント側のメモリやプロンプトで揃える**ハイブリッドな方針になる。

## MCP 対応状況の現在地 (2026 年 4 月時点)

| エージェント | カスタム MCP 接続 | 備考 |
|---|---|---|
| Claude.ai (チャット) | ○ | この MCP Proxy が繋がっている前提 |
| Claude Code Web | ─ | 専用 GitHub プロキシ + GitHub App で別経路 (第 1 回参照) |
| Codex CLI | ○ | ローカルから MCP サーバー追加可能 |
| Codex Web | ✕ | 現状 MCP 非対応 (本人申告ベース) |
| ChatGPT (Plus / Pro) | △ | developer mode で限定的に対応 |
| ChatGPT (Business / Enterprise / Edu) | ○ | developer mode 経由で full MCP 対応 (beta) |

ChatGPT 側の状況については OpenAI の公式ヘルプ ([Developer mode and full MCP connectors in ChatGPT [beta]](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta)) に詳しい。リモート MCP サーバーのみ対応、SSE / streaming HTTP プロトコル、OAuth 認証対応、書き込みアクションには確認モーダルが出る、といった具合だ。

私の運用では、現状 ChatGPT 本体に MCP は繋いでいない。後述するルールセットを GPT メモリで仕込み、ChatGPT が GitHub に対して何かするときは「私が手動で Issue や PR を立てるための文面を整えてもらう」という形にしている。Codex Web も同様で、ブラウザ UI 経由で動く範囲では MCP の出る幕がない。

つまり**実質的に MCP Proxy を直接叩いているのは Claude.ai と Codex CLI の 2 つ**ということになる。

## 規律をどこで強制するか: 3 つの層

ルール整合は、おおむね 3 つの層で考えている。

| 層 | 強制方法 | 効く相手 |
|---|---|---|
| MCP サーバー層 | サーバー側 validator (第 3 回) | MCP を叩いてくる全クライアント |
| エージェントメモリ層 | GPT メモリ / Claude.ai のプロジェクト指示 | そのエージェントが起こす全アクション (MCP 経由かどうか問わず) |
| 人手の最終確認層 | コミット前の私のレビュー | 書き込み系アクションの最後の砦 |

理想は MCP サーバー層だけで完結することだが、Codex Web や ChatGPT のように MCP を叩かない経路では、エージェントメモリ層に同じルールを別実装で持たせるしかない。

## エージェントメモリ層: 同じルールを別言語で書く

ChatGPT (Codex Web 含む) の GPT メモリには、Issue / PR 生成ルールを英語で仕込んでいる。

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

これを Claude 側 MCP Proxy のサーバー側 validator と並べると、ほとんど同じ規約をしゃべっていることがわかる。

- title フォーマット: 両者とも `<type>: <summary>` 形式、長さ制限同じ (100 字 / 10000 字)
- GitMoji prefix: emoji 10 種類が両者で一致
- 新規ラベル禁止: 両者で一致
- Sprint 番号計算: 基準日 2026-01-05、14 日刻み、v1〜v26、JST。両者で一致

差分は次の 2 点だけ。

1. bot ラベル: Claude 経由は `bot/Anthropic/ClaudeAI`、ChatGPT / Codex Web 経由は `bot/OpenAI/ChatGPT` または `bot/OpenAI/Codex Web`
2. project ラベル: ChatGPT 側は `project/<repo-name>` を自動推論し、例外マッピングを GPT メモリに持つ。Claude 側 MCP Proxy は「既存ラベルのみ使用、新規作成禁止」で、推論は行わずクライアント側で適切な既存ラベルを指定させる

bot ラベルでエージェントを区別することで、後から「この PR はどのエージェントが立てたか」が一目でわかる。`bot/*` のフィルタをかければエージェント単位の作業履歴が抽出できる。

## ラベル管理の方針: 新規作成は人間だけ

両エージェントで一致させているルールのうち、特に重要なのが新規ラベル作成の全面禁止だ。

GitHub のラベルは、エージェントに自由を許すと数日で破綻する。`bug-fix` / `bugfix` / `🐛 bug` / `Bug` が並ぶ。粒度の異なる `frontend` と `ui` と `web` が混在する。一度発生した表記ゆれを後から統合するのは、想像より遥かに重い作業だ。

なので、エージェントは既存ラベルから選ぶだけ。指定したラベルが存在しない場合は、Claude 側 MCP Proxy では警告ログを残してスキップ (Issue 作成自体は通す)、ChatGPT 側は GPT メモリのルールで「違反があったら submission 前に修正する」よう指示している。

「人間が新規作成、エージェントは選ぶだけ」という非対称性が、ラベル体系の秩序を保つ最低限の条件だと考えている。

## sprint 番号の同一計算式

地味に効いているのが、Sprint 番号を両エージェントで**同じ計算式**にしている点だ。

- 基準日: 2026-01-05 (JST)
- 周期: 14 日
- 計算: `sprint = floor((date - base) / 14) + 1`
- 有効範囲: v1〜v26 (2027-01-03 まで)

Claude 側 MCP Proxy のコードと、ChatGPT 側 GPT メモリの記述で、この計算式が一字一句揃っている。これがズレると同じ日に立てた Issue が `sprint-v8` と `sprint-v9` に分かれて記録され、後から進捗を集計するときに困る。

## まとめ: ルールはあるが、強制経路は揃わない

シリーズを通じて書いてきたことを 4 回分まとめる。

- (1) Claude.ai のチャットから GitHub に書き込む手段が公式には無いので自前 MCP Proxy を立てた
- (2) Cloudflare Workers + workers-oauth-provider + GitHub OAuth App。OAuth App は権限が粗いのでサーバー側で絞る方針に倒した
- (3) ガードレールはツール / リポジトリ / ブランチ / ファイル / identity / validator の 6 系統。「届かないものは安全」と「規律は中間のサーバーで保証」の 2 つの考え方が中心
- (4) MCP を叩けないエージェント (ChatGPT / Codex Web) には GPT メモリで同じルールを別実装する。Claude 側との差分は bot ラベルと project ラベル推論の有無だけ

複数のエージェントが同じリポを触る運用は、現状の各社 MCP 対応状況だと「全部 MCP で揃える」が成立しない。**サーバー側で強制できるところはサーバーで、できないところはエージェントメモリで、最後は人手で**、という三段構えで運用している。

このシリーズで書いた仕組みは、まだ私一人しか繋いでいない自分用のサーバーだ。誰かが同じことをやりたくなった時の参考になれば幸いだ。