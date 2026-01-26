import fs from "fs";
import path from "path";

const SOURCE_DIR = path.join(process.cwd(), "_posts/images");
const TARGET_DIR = path.join(process.cwd(), "public/images");

function syncImages() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.warn("Source directory _posts/images does not exist. Skipping.");
    return;
  }

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  try {
    fs.cpSync(SOURCE_DIR, TARGET_DIR, {
      recursive: true,
      force: true,
    });
  } catch (err) {
    console.error("Error syncing images:", err);
    process.exit(1);
  }
}

syncImages();
