import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({ variable: "--font-display", subsets: ["latin"], weight: ["700", "800", "900"] });
const body = Public_Sans({ variable: "--font-body", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Issue Scout",
  description: "Find open source issues you can actually fix, ranked by repo health and contribution policy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
