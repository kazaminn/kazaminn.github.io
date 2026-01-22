import { type Author } from "./author";

export type Post = {
  slug: string;
  title: string;
  date: string;
  author: Author;
  coverImage?: string;
  category?: string;
  summary?: string;
  ogImage?: {
    url: string;
  };
  content: string;
};
