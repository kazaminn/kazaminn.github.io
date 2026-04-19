"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SITE_METADATA } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="pt-safe sticky top-0 z-20 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-8">
        <Link
          href="/"
          className="font-display text-[15px] font-semibold tracking-tight text-accent no-underline"
        >
          {SITE_METADATA.author.name.toLowerCase()}
        </Link>

        <nav aria-label="サイトメニュー" className="flex gap-1">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-sm bg-accent/20 px-4 py-2 font-sans text-[13px] text-accent no-underline transition-colors"
                    : "rounded-sm px-4 py-2 font-sans text-[13px] text-sub no-underline transition-colors hover:text-text"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
export default Header;
