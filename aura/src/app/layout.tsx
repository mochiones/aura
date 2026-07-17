import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
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
      <body className="min-h-dvh bg-[#F7F6F3] text-[#1A1A2E]">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
