import type { Metadata } from "next";
import "./globals.css";

import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { PrivacyBanner } from "@/components/PrivacyBanner";

export const metadata: Metadata = {
  title: "kjedi — contract review",
  description: "Local-only contract review with Claude Opus 4.7.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-screen flex-col overflow-hidden">
        <PrivacyBanner />
        {children}
        <DisclaimerFooter />
      </body>
    </html>
  );
}
