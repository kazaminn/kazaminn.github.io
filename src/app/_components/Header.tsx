"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/app/_components/ThemeToggle";
import { SITE_METADATA } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
  ] as const;

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border dark:border-border-dark text-fg dark:text-fg-dark bg-bg/90 dark:bg-bg-dark/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex-1">
          <Link
            href="/"
            className="text-fg dark:text-fg-dark text-xl font-bold tracking-tight hover:opacity-70 transition-opacity hover:underline"
          >
            {SITE_METADATA.title}
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-8 text-sm font-medium">
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors ${
                isActive(href)
                  ? "text-link dark:text-link-dark hover:underline"
                  : "text-mute dark:text-mute-dark hover:text-link dark:hover:text-link-dark hover:underline"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
export default Header;
