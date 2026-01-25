"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/app/_components/ThemeToggle";
import { NAV_ITEMS, SITE_METADATA } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/90 text-fg backdrop-blur-md dark:border-border-dark dark:bg-bg-dark/90 dark:text-fg-dark">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <div className="flex-1">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-fg transition-opacity hover:underline hover:opacity-70 dark:text-fg-dark"
          >
            {SITE_METADATA.title}
          </Link>
        </div>

        <nav
          className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium md:flex"
          aria-label="サイトメニュー"
        >
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors ${
                isActive(href)
                  ? "text-link hover:underline dark:text-link-dark"
                  : "text-mute hover:text-link hover:underline dark:text-mute-dark dark:hover:text-link-dark"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
export default Header;
