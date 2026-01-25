export const SITE_METADATA = {
  url: "https://kazaminn.github.io",
  title: `Kazaminn's blog`,
  description: `React開発メインの備忘録`,
  author: {
    name: `Kazaminn`,
    picture: "/assets/blog/authors/kazaminn.jpg",
    description: "Webエンジニア",
    github: "https://github.com/kazaminn",
  },

  openGraph: {
    images: ["/assets/og-default.jpg"],
  },
} as const;

export const NAV_ITEMS = [
  { label: "ホーム", href: "/" },
  { label: "ブログ", href: "/blog" },
  { label: "私について", href: "/about" },
] as const;
