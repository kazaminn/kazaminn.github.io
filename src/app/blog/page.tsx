import { Metadata } from "next";
import Link from "next/link";
import FormattedDate from "@/app/_components/FormattedDate";
import Tag from "@/app/_components/Tag";
import { getAllPosts } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";
import Breadcrumbs from "../_components/Breadcrumbs";

export default function BlogListPage() {
  const allPosts = getAllPosts();

  return (
    <section className="page-in mx-auto max-w-2xl px-6 pt-12 pb-16">
      <Breadcrumbs segments={["Blog"]} />
      <header className="mb-8">
        <h1 className="m-0 mb-2 font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">
          Blog
        </h1>
        <p className="m-0 font-sans text-sm text-sub">
          技術、デザイン、そして日々の記録。
        </p>
      </header>

      {allPosts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="mb-3 block rounded-md border border-border-soft bg-card p-6 text-inherit no-underline transition hover:-translate-y-px hover:border-accent/20 hover:bg-card-hover hover:shadow-[0_4px_20px_rgba(94,228,160,0.03)]"
        >
          <div className="mb-2 font-mono text-[11px] text-faint">
            <FormattedDate dateString={post.date} />
          </div>
          <h2 className="m-0 mb-2 font-display text-lg leading-snug font-semibold tracking-tight text-heading">
            {post.title}
          </h2>
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
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `ブログ | ${SITE_METADATA.title}`;
  return {
    title,
    openGraph: { title },
  };
}
