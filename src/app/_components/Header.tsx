"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { List, XLg } from "react-bootstrap-icons";
import { NAV_ITEMS, SITE_METADATA } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="pt-safe sticky top-0 z-20 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-8">
        <Link
          href="/"
          className="font-display text-sm font-semibold tracking-tight text-accent no-underline"
        >
          {SITE_METADATA.author.name.toLowerCase()}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="サイトメニュー" className="hidden gap-1 sm:flex">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-sm bg-accent/20 px-4 py-2 font-sans text-xs text-accent no-underline transition-colors"
                    : "rounded-sm px-4 py-2 font-sans text-xs text-sub no-underline transition-colors hover:text-text"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger button */}
        <button
          className="flex items-center justify-center rounded-sm p-2 text-shadow-text transition-colors hover:text-text sm:hidden"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <XLg size={20} /> : <List size={20} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav
          aria-label="モバイルメニュー"
          className="border-t border-white/10 bg-black/60 backdrop-blur-sm sm:hidden"
        >
          <ul className="mx-auto flex max-w-5xl flex-col px-8 py-3">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "block rounded-sm px-4 py-3 font-sans text-sm text-accent no-underline"
                        : "block rounded-sm px-4 py-3 font-sans text-sm text-sub no-underline hover:text-text"
                    }
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
export default Header;
