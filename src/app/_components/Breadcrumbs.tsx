import Link from "next/link";
import { ChevronRight } from "react-bootstrap-icons";
import { NAV_ITEMS } from "@/lib/constants";

export function Breadcrumbs({ segments }: { segments: string[] }) {
  return (
    <nav
      aria-label="現在位置"
      className="mb-6 font-mono text-sm text-faint"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
        <li>
          <Link href="/" className="text-faint">
            {NAV_ITEMS[0].label}
          </Link>
        </li>
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <ChevronRight
              size={10}
              aria-hidden="true"
              className="opacity-60"
            />
            {i === segments.length - 1 ? (
              <span className="text-sub">{s}</span>
            ) : (
              <Link href={NAV_ITEMS[1].href} className="text-faint">
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
