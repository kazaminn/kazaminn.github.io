import { createHash } from "crypto";
import fs from "fs";
import path from "path";
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

const FONT_CACHE_DIR = path.join(process.cwd(), ".cache", "og-fonts");
const UA =
  "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0";

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      lastErr = err;
      const backoff = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

async function loadNotoSansJP(text: string): Promise<ArrayBuffer> {
  const key = createHash("sha1").update(text).digest("hex").slice(0, 16);
  const cachePath = path.join(FONT_CACHE_DIR, `noto-sans-jp-700-${key}.bin`);

  if (fs.existsSync(cachePath)) {
    const buf = fs.readFileSync(cachePath);
    return buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (
    await fetchWithRetry(cssUrl, { headers: { "User-Agent": UA } })
  ).text();
  const fontUrl = css.match(/src:\s*url\((.+?)\)/)?.[1];
  if (!fontUrl) {
    throw new Error(
      "Failed to resolve Noto Sans JP font URL from Google Fonts CSS",
    );
  }
  const fontData = await (
    await fetchWithRetry(fontUrl, {})
  ).arrayBuffer();

  fs.mkdirSync(FONT_CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, Buffer.from(fontData));

  return fontData;
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
          background:
            "radial-gradient(ellipse 120% 60% at 30% 20%, rgba(94,228,160,0.18) 0%, transparent 60%), radial-gradient(ellipse 100% 50% at 70% 15%, rgba(96,160,232,0.14) 0%, transparent 55%), linear-gradient(135deg, #08090e 0%, #0e1018 100%)",
          color: "#e4e8f4",
          fontFamily: "Noto Sans JP",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#5ee4a0" }}>
          {siteTitle}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8a90a8" }}>
          {author}
        </div>
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
