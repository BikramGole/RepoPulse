import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c14",
};

export const metadata: Metadata = {
  title: "CommitRank | Developer Leaderboard",
  description:
    "Real-time GitHub leaderboard ranking developers by contributions, stars, and activity velocity. 100% authentic live data.",
  metadataBase: new URL("https://repulse.vercel.app"),
  openGraph: {
    title: "CommitRank | Developer Leaderboard",
    description: "Real-time GitHub leaderboard powered by authentic GraphQL data.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://avatars.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.github.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#0a0a0a] text-neutral-200">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
