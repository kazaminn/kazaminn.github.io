import { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import { SITE_METADATA } from "@/lib/constants";

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
