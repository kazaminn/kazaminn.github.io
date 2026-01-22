import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import FormattedDate from "@/app/_components/FormattedDate";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";
import markdownToHtml from "@/lib/markdownToHtml";

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

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
        {post.summary && <p>{post.summary}</p>}
        <div
          className="markdown"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <Link
          href="/blog"
          className="mt-8 inline-block text-sm font-medium text-link hover:underline dark:text-link-dark"
        >
          ← 記事一覧に戻る
        </Link>
      </div>
    </article>
  );
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | ${SITE_METADATA.title}`;
  const images = post.ogImage && [post.ogImage.url];

  return {
    title,
    openGraph: {
      title,
      images,
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
