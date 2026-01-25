import type { Viewport } from "next";
import Footer from "@/app/_components/Footer";
import Header from "@/app/_components/Header";
import HtmlMeta from "./_components/HtmlMeta";
import ThemeProvider from "./_components/ThemeProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172b" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <HtmlMeta />
      <body>
        <ThemeProvider>
          <div className="bg-bg text-fg dark:bg-bg-dark dark:text-fg-dark">
            <Header />
            <main className="mx-auto min-h-[calc(100vh-16rem)] max-w-2xl px-6 py-12">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
