import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import { SITE_METADATA } from "@/lib/constants";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

type Props = { params: Promise<{ slug: string }> };

async function loadNotoSansJP(text: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0",
    },
  }).then((r) => r.text());
  const fontUrl = css.match(/src:\s*url\((.+?)\)/)?.[1];
  if (!fontUrl) {
    throw new Error("Failed to resolve Noto Sans JP font URL from Google Fonts CSS");
  }
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

export default async function Image(props: Props) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? SITE_METADATA.title;
  const siteTitle = SITE_METADATA.title;
  const author = SITE_METADATA.author.name;

  const uniqueChars = Array.from(new Set((title + siteTitle + author).split(""))).join("");
  const fontData = await loadNotoSansJP(uniqueChars);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "Noto Sans JP",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, opacity: 0.7 }}>{siteTitle}</div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.6 }}>{author}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
