import Link from "next/link";
import FormattedDate from "@/app/_components/FormattedDate";
import { getAllPosts } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";

export default function HomePage() {
  const allPosts = getAllPosts();

  return (
    <div className="space-y-16">
      <section className="py-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
          Building for everyone.
        </h1>
        <p className="max-w-xl text-xl leading-relaxed">
          こんにちは、{SITE_METADATA.author.name}
          です。このサイトでは、技術的な知見や日々の思考を「読みやすさ」にこだわって発信しています。
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/blog"
            className="rounded-lg bg-bg-dark px-5 py-2.5 font-medium text-fg-dark transition-opacity hover:opacity-90 dark:bg-bg dark:text-fg"
          >
            ブログを読む
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-fg px-5 py-2.5 font-medium text-fg transition-colors hover:opacity-90 dark:border-fg-dark dark:text-fg-dark"
          >
            私について
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">Latest Articles</h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-link hover:underline dark:text-link-dark"
          >
            すべての記事
          </Link>
        </div>
        <div className="space-y-10">
          {allPosts.slice(0, 2).map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block text-fg dark:text-fg-dark"
              >
                <div className="mb-2 flex items-center gap-3 text-xs">
                  <FormattedDate dateString={post.date} />
                  {post.category && (
                    <span className="rounded px-2 py-0.5">{post.category}</span>
                  )}
                </div>
                <h3 className="mb-2 text-xl font-bold transition-colors hover:text-link hover:underline dark:hover:text-link-dark">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="line-clamp-2 leading-relaxed">{post.summary}</p>
                )}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
