import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forecast — Fashion Trend Intelligence",
  description:
    "Scores fashion trends from TikTok, runway, resale, editorial and more, and projects when each one will peak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight">
                FORECAST
              </span>
              <span className="hidden text-xs font-medium uppercase tracking-widest text-stone-500 sm:inline">
                Fashion trend intelligence
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link href="/" className="hover:text-rose-900">
                Dashboard
              </Link>
              <Link href="/colors" className="hover:text-rose-900">
                Colors
              </Link>
              <Link href="/methodology" className="hover:text-rose-900">
                Methodology
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Forecast v1 — scores computed from a curated seed dataset of
              433 observations across 12 trends and 8 weeks.
            </span>
            <span>Not buying advice. Trends are directional, not certain.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
