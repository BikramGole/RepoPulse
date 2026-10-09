import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommitRank | Developer Leaderboard",
  description: "A GitHub leaderboard ranking developers by contributions, stars, and activity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-[#0a0a0a] text-neutral-200">
        {children}
      </body>
    </html>
  );
}
