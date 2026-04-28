import { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import { SITE_METADATA } from "@/lib/constants";

type ProjectComponent = {
  label: string;
  stack: string[];
  repo: { label: string; href: string };
};

type Project = {
  name: string;
  description: string;
  components: ProjectComponent[];
  liveDemo?: string;
  note?: string;
};

const PROJECTS: Project[] = [
  {
    name: "MyYomuMoji",
    description:
      "「自分が読みやすい文字設定」を名刺カードのように作って共有できる Web アプリ。フォント・サイズ・行間・配色を選び、固有 URL でまわりの人に渡せます。ディスレクシアやロービジョンなど、人それぞれの読みやすさを伝えるためのツールです。",
    components: [
      {
        label: "frontend",
        stack: ["React 19", "TypeScript", "Vite", "Tailwind CSS v4", "React Aria"],
        repo: { label: "myyomumoji-client", href: "https://github.com/kazaminn/myyomumoji-client" },
      },
      {
        label: "backend",
        stack: ["Hono", "TypeScript", "Firebase Firestore", "Zod"],
        repo: { label: "myyomumoji-api", href: "https://github.com/kazaminn/myyomumoji-api" },
      },
    ],
    liveDemo: "https://myyomumoji-client.vercel.app/",
  },
  {
    name: "GitHub-MCP-Proxy",
    description:
      "AI エージェントに GitHub 作業を任せたいけれど、アカウント全体への権限は渡したくない、という課題に応えるためのセルフホスト型 MCP サーバー。エージェントが触れるリポジトリ・操作（read / issues / 書き込み）・ブランチ名・コミットメッセージ形式を絞り込めるので、安心して任せられます。",
    components: [
      {
        label: "server",
        stack: ["Cloudflare Workers", "TypeScript", "Hono", "Octokit", "OAuth 2.1", "Zod"],
        repo: { label: "github-mcp-proxy", href: "https://github.com/kazaminn/github-mcp-proxy" },
      },
    ],
    note: "OSS として公開しています（個人運用のため、公開エンドポイントは提供していません）。",
  },
];

const STACK = [
  "React 19",
  "TypeScript",
  "Next.js",
  "Tailwind CSS v4",
  "Vitest",
];

const SKILLS = [
  {
    label: "Frontend",
    desc: "Next.js / React / TypeScript を中心に、保守しやすいUIを作っています。",
  },
  {
    label: "Accessibility",
    desc: "WCAG を踏まえた設計。キーボード操作とスクリーンリーダー対応を最初から。",
  },
  {
    label: "AI workflow",
    desc: "Claude Code をはじめとするエージェントとの協業で、分業と品質ゲートを設計。",
  },
];

export default function AboutPage() {
  return (
    <div className="page-in">
      <section className="mx-auto max-w-2xl px-6 pt-12 pb-8">
        <Breadcrumbs segments={["私について"]} />
        <header className="mb-8">
          <h1 className="m-0 mb-2 font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">
            About
          </h1>
          <p className="m-0 font-sans text-sm text-sub">
            Accessibility is not a feature request.
            <br />
            It&apos;s the default.
          </p>
        </header>

        <div className="grid grid-cols-[auto_1fr] items-start gap-6">
          <div
            aria-hidden="true"
            className="flex h-18 w-18 items-center justify-center rounded-full border-2 border-accent/20 bg-[linear-gradient(135deg,rgba(94,228,160,0.13),rgba(96,160,232,0.13))] font-display text-3xl font-bold text-accent"
          >
            {SITE_METADATA.author.name[0]}
          </div>
          <div>
            <h2 className="m-0 mb-2 font-display text-xl font-semibold text-heading">
              {SITE_METADATA.author.name}
            </h2>
            <p className="m-0 font-sans text-sm leading-relaxed text-sub">
              React と TypeScript で、アプリを作るのが好きです。
              アクセシビリティと、AIエージェントとの協業設計に関心があります。
            </p>
            <div className="mt-3 flex gap-4">
              <Link
                href={SITE_METADATA.author.github}
                className="border-b border-link/20 font-mono text-xs text-link"
              >
                GitHub ↗
              </Link>
              <Link
                href="/blog"
                className="border-b border-link/20 font-mono text-xs text-link"
              >
                Blog ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-8">
        <h3 className="mb-3.5 font-display text-md font-semibold tracking-widest text-faint uppercase">
          Stack
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {STACK.map((t) => (
            <span
              key={t}
              className="rounded-sm border border-border-soft bg-surface px-3 py-1 font-mono text-xs text-sub"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-8">
        <h3 className="mb-5 font-display text-md font-semibold tracking-widest text-faint uppercase">
          Projects
        </h3>
        <dl className="divide-y divide-border-soft border-t border-border-soft">
          {PROJECTS.map((project) => (
            <div
              key={project.name}
              className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[160px_1fr] sm:gap-6"
            >
              <dt className="font-mono text-xs tracking-wide text-accent">
                {project.name}
              </dt>
              <dd className="m-0 space-y-4">
                <p className="m-0 font-sans text-sm leading-relaxed text-text">
                  {project.description}
                </p>
                {project.liveDemo && (
                  <Link
                    href={project.liveDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-sm border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent"
                  >
                    Live demo ↗
                  </Link>
                )}
                {project.note && (
                  <p className="m-0 font-sans text-xs leading-relaxed text-faint">
                    {project.note}
                  </p>
                )}
                <ul className="m-0 space-y-3 list-none p-0">
                  {project.components.map((c) => (
                    <li
                      key={c.label}
                      className="rounded-sm border border-border-soft bg-surface/40 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
                          {c.label}
                        </span>
                        <Link
                          href={c.repo.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-b border-link/20 font-mono text-xs text-link"
                        >
                          GitHub: {c.repo.label} ↗
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.stack.map((s) => (
                          <span
                            key={s}
                            className="rounded-sm border border-border-soft bg-surface px-2 py-0.5 font-mono text-[11px] text-sub"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-16">
        <h3 className="mb-5 font-display text-md font-semibold tracking-widest text-faint uppercase">
          Focus
        </h3>
        <dl className="divide-y divide-border-soft border-t border-border-soft">
          {SKILLS.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-1 gap-1 py-5 sm:grid-cols-[140px_1fr] sm:gap-6"
            >
              <dt className="font-mono text-xs tracking-wide text-accent">
                {item.label}
              </dt>
              <dd className="m-0 font-sans text-sm leading-relaxed text-text">
                {item.desc}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `About | ${SITE_METADATA.title}`;
  return {
    title,
    openGraph: { title },
  };
}
