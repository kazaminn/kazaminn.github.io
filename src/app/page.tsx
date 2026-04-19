import Link from "next/link";
import FormattedDate from "@/app/_components/FormattedDate";
import Tag from "@/app/_components/Tag";
import { getAllPosts } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";

export default function HomePage() {
  const recent = getAllPosts().slice(0, 4);

  return (
    <div className="page-in">
      <header className="mx-auto max-w-2xl px-6 pt-12 pb-6">
        <h1 className="m-0 font-display text-2xl leading-tight font-bold tracking-tight text-heading sm:text-3xl">
          Make the world{" "}
          <span className="aurora-glow font-normal text-accent italic">
            accessible
          </span>
          <br />
          for everyone.
        </h1>
        <p className="mt-3 mb-0 max-w-md font-sans text-sm leading-relaxed text-sub">
          {SITE_METADATA.author.description}。
          React・TypeScript・AIエージェントとの協業について書いています。
        </p>
      </header>

      <section className="mx-auto max-w-2xl px-6 pt-6 pb-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="m-0 font-display text-xs font-semibold tracking-widest text-faint uppercase">
            Recent Posts
          </h2>
          <Link
            href="/blog"
            className="font-mono text-[11px] text-link hover:text-link-hover"
          >
            all posts →
          </Link>
        </div>

        {recent.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="mb-3 block rounded-md border border-border-soft bg-card p-6 text-inherit no-underline transition hover:-translate-y-px hover:border-accent/20 hover:bg-card-hover hover:shadow-[0_4px_20px_rgba(94,228,160,0.03)]"
          >
            <div className="mb-2 font-mono text-[11px] text-faint">
              <FormattedDate dateString={post.date} />
            </div>
            <h3 className="m-0 mb-2 font-display text-lg leading-snug font-semibold tracking-tight text-heading">
              {post.title}
            </h3>
            {post.summary && (
              <p className="m-0 mb-3 font-sans text-sm leading-relaxed text-sub">
                {post.summary}
              </p>
            )}
            {post.category && (
              <div className="flex flex-wrap gap-1.5">
                <Tag label={post.category} />
              </div>
            )}
          </Link>
        ))}
      </section>
    </div>
  );
}
