import {
  AlertCircle,
  Info,
  Lightbulb,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import type { CustomBlockType } from "@kazamitte/markdown-plugin";

export const SITE_METADATA = {
  url: "https://kazaminn.github.io",
  title: `Kazaminn's blog`,
  description: `React開発メインの備忘録`,
  author: {
    name: `Kazaminn`,
    picture: "/assets/blog/authors/kazaminn.jpg",
    description: "アプリ作るのが好きな人",
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

// > [!NOTE]
// > Useful information that users should know, even when skimming content.

// > [!TIP]
// > Helpful advice for doing things better or more easily.

// > [!IMPORTANT]
// > Key information users need to know to achieve their goal.

// > [!WARNING]
// > Urgent info that needs immediate user attention to avoid problems.

// > [!CAUTION]
// > Advises about risks or negative outcomes of certain actions.
export const CUSTOM_BLOCK_TYPES = {
  NOTE: {
    title: "補足",
    icon: Info,
  },
  TIP: {
    title: "ヒント",
    icon: Lightbulb,
  },
  IMPORTANT: {
    title: "重要",
    icon: AlertCircle,
  },
  WARNING: {
    title: "注意",
    icon: TriangleAlert,
  },
  CAUTION: {
    title: "警告",
    icon: OctagonAlert,
  },
} as const satisfies Record<CustomBlockType, unknown>;

export type { CustomBlockType };
