import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export function rehypeHeadingIds() {
  return (tree: any) => {
    visit(tree, "element", (node) => {
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
        const textContent = node.children
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.value)
          .join("");

        const hash = createHash("md5")
          .update(textContent)
          .digest("hex")
          .slice(0, 6);
        node.properties.id = `h-${hash}`;
      }
    });
  };
}

export function rehypeImageMetadata() {
  return (tree: any) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img") {
        let { src } = node.properties;
        if (src) {
          if (src.startsWith("./images/")) {
            src = src.replace("./images/", "/images/");
            node.properties.src = src;
          }
        }
        if (src && src.startsWith("/")) {
          const imagePath = path.join(process.cwd(), "public", src);
          if (fs.existsSync(imagePath)) {
            try {
              const buffer = fs.readFileSync(imagePath);
              const dimensions = sizeOf(buffer);
              node.properties.width = dimensions.width;
              node.properties.height = dimensions.height;
            } catch (err) {
              console.error(`Error sizing image: ${imagePath}`, err);
            }
          }
        }
      }
    });
  };
}

export const mdxOptions = {
  parseFrontmatter: true,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeHeadingIds,
      rehypeImageMetadata,
      [
        rehypePrettyCode,
        {
          theme: "nord",
          keepBackground: true,
        },
      ],
    ],
  },
};
