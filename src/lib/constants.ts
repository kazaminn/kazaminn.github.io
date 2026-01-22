export const SITE_METADATA = {
  url: "http://localhost:3000/",
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
