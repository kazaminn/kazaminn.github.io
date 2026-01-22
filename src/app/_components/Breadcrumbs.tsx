import Link from "next/link";
import { ChevronRight } from "react-bootstrap-icons";

export function Breadcrumbs({ segments }: { segments: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-2 text-sm text-mute dark:text-mute-dark">
        <li>
          <Link
            href="/"
            className="transition-colors hover:text-link hover:underline dark:hover:text-link-dark"
          >
            Home
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
                href="/blog"
                className="capitalize transition-colors hover:text-link hover:underline dark:hover:text-link-dark"
              >
                {s}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export default Breadcrumbs;
