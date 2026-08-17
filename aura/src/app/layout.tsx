import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { EntriesProvider } from "@/context/entries-context";
import { DesktopHeader } from "@/components/navigation/desktop-header";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { EntriesSidebarSlot } from "@/components/navigation/entries-sidebar-slot";
import { Toaster } from "@/components/ui/sonner";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
    <html lang="pl" className={`${roboto.variable} antialiased`}>
      <body className="h-dvh flex flex-col bg-[#F7F6F3] text-[#1A1A2E]">
        <EntriesProvider>
          <DesktopHeader />

          {/* Desktop: two-column layout, niezależne scrollowanie paneli */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <EntriesSidebarSlot />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>

          {/* Mobile: single column, naturalne scrollowanie */}
          <main className="md:hidden flex-1 overflow-y-auto pb-20">{children}</main>

          <MobileNav />
          <Toaster position="bottom-center" richColors />
        </EntriesProvider>
      </body>
    </html>
  );
}
