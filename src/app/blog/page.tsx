import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";
import Breadcrumbs from "../_components/Breadcrumbs";
import FormattedDate from "../_components/FormattedDate";

export default function BlogListPage() {
  const allPosts = getAllPosts();

  return (
    <section>
      <Breadcrumbs segments={["Blog"]} />
      <header className="mb-12">
        <h1 className="mb-2 text-3xl font-bold">Blog</h1>
        <p>技術、デザイン、そして日々の記録。</p>
      </header>
      <div className="space-y-12">
        {allPosts.map((post) => (
          <article key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block text-fg dark:text-fg-dark"
            >
              <header className="mb-2">
                <div className="mb-2 flex items-center gap-3 text-xs">
                  <FormattedDate dateString={post.date} />
                  <span className="font-medium text-mute dark:text-mute-dark">
                    #{post.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold transition-colors hover:text-link hover:underline dark:hover:text-link-dark">
                  {post.title}
                </h2>
              </header>
              <p>{post.summary}</p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `ブログ | ${SITE_METADATA.title}`;
  return {
    title,
    openGraph: {
      title,
    },
  };
}
