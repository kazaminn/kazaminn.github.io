import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import ExportedImage from "next-image-export-optimizer";
import type { Components } from "react-markdown";
import { Callout } from "@/app/_components/Callout";
import { CUSTOM_BLOCK_TYPES, type CustomBlockType } from "./constants";

const isDev = process.env.NODE_ENV === "development";

export const markdownComponents: Components = {
  h2: ({ children, id }) => <h2 id={id}>{children}</h2>,
  h3: ({ children, id }) => <h3 id={id}>{children}</h3>,
  h4: ({ children, id }) => <h4 id={id}>{children}</h4>,
  a: ({ node: _node, href, children, ...props }) => {
    const isInternal =
      href != undefined && (href.startsWith("/") || href.startsWith("#"));
    if (isInternal) {
      return (
        <Link href={href} {...props}>
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
  img: ({ src, alt, width, height }) => {
    if (typeof src !== "string") return null;
    return (
      <ExportedImage
        src={src}
        alt={alt ?? ""}
        width={typeof width === "string" ? Number(width) : width}
        height={typeof height === "string" ? Number(height) : height}
        sizes="(max-width: 800px) 100vw, 800px"
        style={{ width: "100%", height: "auto" }}
        unoptimized={isDev}
        className="border-base-muted my-8 rounded-xl border shadow-sm"
      />
    );
  },
  div: ({
    node: _node,
    className,
    ...props
  }: ComponentPropsWithoutRef<"div"> & {
    node?: unknown;
    "data-custom-block-type"?: CustomBlockType;
    "data-shortcode"?: string;
    "data-key"?: string;
  }) => {
    const blockType = props["data-custom-block-type"];
    if (blockType && blockType in CUSTOM_BLOCK_TYPES) {
      return <Callout type={blockType}>{props.children}</Callout>;
    }
    return <div className={className} {...props} />;
  },
};
