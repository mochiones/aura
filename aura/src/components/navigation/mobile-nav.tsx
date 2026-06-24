"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, PenLine, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Wpisy", icon: List },
  { href: "/entries/new", label: "Nowy wpis", icon: PenLine },
  { href: "#profil", label: "Profil", icon: User, disabled: true },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Nawigacja mobilna"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-[#EBEBF0] flex items-center justify-around px-4 py-2 safe-area-pb"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, disabled }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={disabled ? "#" : href}
            aria-disabled={disabled}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors min-w-[60px]",
              isActive
                ? "text-[#1A1A2E]"
                : "text-[#9B9BAD] hover:text-[#1A1A2E]",
              disabled && "opacity-40 pointer-events-none"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
