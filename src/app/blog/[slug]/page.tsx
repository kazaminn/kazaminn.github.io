import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import ContentBody from "@/app/_components/ContentBody";
import FormattedDate from "@/app/_components/FormattedDate";
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
    <article>
      <Breadcrumbs segments={["Blog", post.title]} />
      <header className="mb-10 border-b border-border pb-8 dark:border-border-dark">
        <div className="mb-3 flex items-center gap-3 text-sm text-mute dark:text-mute-dark">
          <FormattedDate dateString={post.date} />
          {post.category && (
            <>
              <span>•</span>
              <span className="font-medium">{post.category}</span>
            </>
          )}
        </div>
        <h1 className="mb-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
      </header>
      <div className="max-w-none space-y-6 text-lg">
        <section className="min-h-50">
          <ContentBody content={post.content || ""} />
        </section>

        <footer>
          <Link href="/blog">← 記事一覧に戻る</Link>
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
      images: post.ogImage ? [{ url: post.ogImage.url, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.ogImage ? [post.ogImage.url] : [],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
