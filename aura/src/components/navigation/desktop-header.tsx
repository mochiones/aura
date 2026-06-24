"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function DesktopHeader() {
  const pathname = usePathname();
  const isNewEntry = pathname === "/entries/new";

  return (
    <header className="hidden md:flex sticky top-0 z-40 bg-[#F7F6F3]/80 backdrop-blur-sm border-b border-[#EBEBF0] items-center justify-between px-6 py-4">
      <Link href="/" className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
        Aura
      </Link>
      {!isNewEntry && (
        <Link
          href="/entries/new"
          className={cn(
            buttonVariants({ variant: "default" }),
            "rounded-full bg-[#1A1A2E] hover:bg-[#333333] text-white px-5"
          )}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nowy wpis
        </Link>
      )}
    </header>
  );
}
