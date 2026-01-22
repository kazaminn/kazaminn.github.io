import Image from "next/image";
import { Github } from "react-bootstrap-icons";
import { SITE_METADATA } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg text-fg dark:border-border-dark dark:bg-bg-dark dark:text-fg-dark">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Image
            src={SITE_METADATA.author.picture}
            alt={SITE_METADATA.author.name}
            className="h-16 w-16 rounded-full border border-border object-cover dark:border-border-dark"
            width="64"
            height="64"
          />
          <div className="text-center sm:text-left">
            <h2 className="mb-1 text-lg font-bold">
              {SITE_METADATA.author.name}
            </h2>
            <p className="text-sm leading-relaxed">
              {SITE_METADATA.author.description}
            </p>
            <div className="mt-4 flex justify-center gap-4 sm:justify-start">
              <a
                href={SITE_METADATA.author.github}
                aria-label="Github"
                className="text-mute transition-colors hover:text-link hover:underline dark:text-mute-dark dark:hover:text-link-dark"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-mute dark:text-mute-dark">
          © 2026 {SITE_METADATA.author.name}.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
