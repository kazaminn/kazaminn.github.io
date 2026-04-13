import fs from "fs";
import path from "path";

const DIST_DIR = path.join(process.cwd(), "dist");

function renameOgImages() {
  if (!fs.existsSync(DIST_DIR)) {
    console.warn("dist directory does not exist. Skipping.");
    return;
  }

  const renamed = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "opengraph-image") {
        const next = full + ".png";
        fs.renameSync(full, next);
        renamed.push(path.relative(DIST_DIR, next));
      }
    }
  }

  walk(DIST_DIR);
  return renamed;
}

function rewriteHtmlReferences() {
  let rewritten = 0;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".html")) {
        const original = fs.readFileSync(full, "utf8");
        const updated = original.replace(
          /(\/opengraph-image)(\?[^"'\s]*)?/g,
          "$1.png$2",
        );
        if (updated !== original) {
          fs.writeFileSync(full, updated);
          rewritten++;
        }
      }
    }
  }

  walk(DIST_DIR);
  return rewritten;
}

const renamed = renameOgImages();
const rewritten = rewriteHtmlReferences();
console.log(
  `postbuild: renamed ${renamed?.length ?? 0} opengraph-image files, ` +
    `rewrote ${rewritten} HTML files`,
);
