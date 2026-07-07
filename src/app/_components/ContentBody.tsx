import { MarkdownAsync } from "react-markdown";
import { normalizeText } from "@kazamitte/markdown-plugin";
import { markdownComponents } from "@/lib/markdownComponents";
import {
  markdownRehypePlugins,
  markdownRemarkPlugins,
} from "@/lib/markdownPlugins";

type ContentBodyProps = {
  content: string;
};

export default async function ContentBody({ content }: ContentBodyProps) {
  if (!content) return undefined;

  const markdown = await MarkdownAsync({
    remarkPlugins: markdownRemarkPlugins,
    rehypePlugins: markdownRehypePlugins,
    remarkRehypeOptions: { allowDangerousHtml: true },
    components: markdownComponents,
    children: normalizeText(content),
  });

  return (
    <div className="markdown prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
      {markdown}
    </div>
  );
}
