import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { EntriesProvider } from "@/context/entries-context";
import { DesktopHeader } from "@/components/navigation/desktop-header";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura — Dzienniczek myśli",
  description: "Prywatna przestrzeń do zapisywania myśli, refleksji i nastrojów.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F6F3] text-[#1A1A2E]">
        <EntriesProvider>
          <DesktopHeader />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <MobileNav />
          <Toaster position="bottom-center" richColors />
        </EntriesProvider>
      </body>
    </html>
  );
}
