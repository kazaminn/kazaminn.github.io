import { Metadata } from "next";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import { SITE_METADATA } from "@/lib/constants";

export default function AboutPage() {
  return (
    <section>
      <Breadcrumbs segments={["私について"]} />
      <h1 className="mb-8 text-3xl font-bold">私について</h1>
      <div className="max-w-none space-y-6">
        <p>
          私はWebエンジニアとして、誰もが使いやすく、情報が正しく伝わるサイト制作を追求しています。
        </p>
        <h2 className="text-xl font-bold">学んでいるスキル</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Next.js / React / TypeScript</li>
          <li>Web Accessibility (WCAG)</li>
          <li>Tailwind CSS</li>
          <li>UI/UX Design</li>
        </ul>
      </div>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `私について | ${SITE_METADATA.title}`;
  return {
    title,
    openGraph: {
      title,
    },
  };
}
