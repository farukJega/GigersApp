import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GigersApp",
  description: "One Marketplace. Every Skill. Secure Payments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a] text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
