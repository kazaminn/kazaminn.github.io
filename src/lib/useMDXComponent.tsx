import type { MDXComponents } from "mdx/types";
import ExportedImage from "next-image-export-optimizer";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, id }) => <h2 id={id}>{children}</h2>,
    h3: ({ children, id }) => <h3 id={id}>{children}</h3>,
    h4: ({ children, id }) => <h4 id={id}>{children}</h4>,
    a: ({ href, children, ...props }) => {
      const isInternal = href?.startsWith("/") || href?.startsWith("#");
      if (isInternal) {
        return (
          <Link href={href as string} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }: any) => (
      <ExportedImage
        src={src}
        alt={alt || ""}
        sizes="(max-width: 800px) 100vw, 800px"
        style={{ width: "100%", height: "auto" }}
        className="my-8 rounded-xl border border-border shadow-sm dark:border-border-dark"
        {...props}
      />
    ),
    ...components,
  };
}
