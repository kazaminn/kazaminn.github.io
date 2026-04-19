import Link from "next/link";
import { Github } from "react-bootstrap-icons";
import { SITE_METADATA } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="pb-safe relative mt-12 border-t border-border-soft px-8 py-10">
      <div className="aurora-divider absolute inset-x-0 -top-px" />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center font-sans text-xs text-faint">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 leading-none">
          <span className="font-display font-semibold text-accent">
            {SITE_METADATA.author.name}
          </span>
          <span aria-hidden="true" className="opacity-30">
            ·
          </span>
          <span>{SITE_METADATA.author.description}</span>
          <span aria-hidden="true" className="opacity-30">
            ·
          </span>
          <Link
            href={SITE_METADATA.author.github}
            aria-label="Github"
            className="inline-flex items-center gap-1 text-link"
          >
            <Github size={14} aria-hidden="true" />
            GitHub
          </Link>
        </div>
        <div className="opacity-50">
          © 2026 {SITE_METADATA.author.name}. Building for everyone.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
