import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import ContentBody from "@/app/_components/ContentBody";
import FormattedDate from "@/app/_components/FormattedDate";
import Tag from "@/app/_components/Tag";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  return (
    <article className="page-in">
      <header className="mx-auto max-w-2xl px-6 pt-12 pb-6">
        <Breadcrumbs segments={["Blog", post.title]} />
        <div className="mb-2.5 flex items-center gap-3 font-mono text-[11px] text-faint">
          <FormattedDate dateString={post.date} />
        </div>
        <h1 className="m-0 font-display text-2xl leading-snug font-bold tracking-tight text-heading sm:text-3xl">
          {post.title}
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-6 pb-16">
        {post.category && (
          <div className="mb-8 flex flex-wrap gap-1.5">
            <Tag label={post.category} />
          </div>
        )}

        <section className="min-h-[200px]">
          <ContentBody content={post.content || ""} />
        </section>

        <footer className="mt-12 border-t border-border-soft pt-6 font-mono text-xs">
          <Link href="/blog" className="text-link">
            ← 記事一覧に戻る
          </Link>
        </footer>
      </div>
    </article>
  );
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) return {};

  const title = `${post.title} | ${SITE_METADATA.title}`;
  const description = post.summary || SITE_METADATA.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
