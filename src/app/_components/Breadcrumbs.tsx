import Link from "next/link";
import { ChevronRight } from "react-bootstrap-icons";
import { NAV_ITEMS } from "@/lib/constants";

export function Breadcrumbs({ segments }: { segments: string[] }) {
  const items = NAV_ITEMS;

  return (
    <nav aria-label="現在位置" className="mb-8">
      <ol className="flex items-center gap-2 text-sm text-mute dark:text-mute-dark">
        <li>
          <Link
            href="/"
            className="transition-colors hover:text-link hover:underline dark:hover:text-link-dark"
          >
            {NAV_ITEMS[0].label}
          </Link>
        </li>
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <ChevronRight
              size={12}
              className="shrink-0 transition-colors"
              aria-hidden="true"
            />
            {i === segments.length - 1 ? (
              <span className="font-medium">{s}</span>
            ) : (
              <Link
                href={NAV_ITEMS[1].href}
                className="capitalize transition-colors hover:text-link hover:underline dark:hover:text-link-dark"
              >
                {NAV_ITEMS[1].label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export default Breadcrumbs;
