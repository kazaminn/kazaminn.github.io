"use client";

import { memo } from "react";
import { NoFOUCScript } from "@/lib/noFOUCScript";

export const ThemeScript = memo(function ThemeScript() {
  const scriptCode = `(${NoFOUCScript.toString()})('theme')`;
  return (
    <script
      id="theme-toggle"
      dangerouslySetInnerHTML={{
        __html: scriptCode,
      }}
    />
  );
});

export function HtmlMeta() {
  return (
    <head>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/favicon/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon/favicon-16x16.png"
      />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link
        rel="mask-icon"
        href="/favicon/safari-pinned-tab.svg"
        color="#000000"
      />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <ThemeScript />
    </head>
  );
}

export default HtmlMeta;
