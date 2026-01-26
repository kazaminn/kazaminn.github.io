import { MDXRemote } from "next-mdx-remote-client/rsc";
import { mdxOptions } from "@/lib/mdxPlugins";
import { useMDXComponents } from "@/lib/useMDXComponent";

type ContentBodyProps = {
  content: string;
};

export default function ContentBody({ content }: ContentBodyProps) {
  const components = useMDXComponents({});

  if (!content) return undefined;

  return (
    <div className="markdown prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
      <MDXRemote
        source={content}
        components={components}
        options={mdxOptions as any}
      />
    </div>
  );
}
