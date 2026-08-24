"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, List, LogOut, PenLine, Settings } from "lucide-react";
import { cn, isAuthRoute } from "@/lib/utils";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Wpisy", icon: List },
  { href: "/entries/new", label: "Nowy wpis", icon: PenLine },
];

const NAV_ITEM_CLASS =
  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors min-w-[60px]";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabaseUser();

  const handleSignOut = async () => {
    await createBrowserSupabaseClient().auth.signOut();
    router.push("/login");
  };

  if (isAuthRoute(pathname)) return null;

  return (
    <nav
      aria-label="Nawigacja mobilna"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-[#EBEBF0] flex items-center justify-around px-4 py-2 safe-area-pb"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              NAV_ITEM_CLASS,
              isActive
                ? "text-[#1A1A2E]"
                : "text-[#9B9BAD] hover:text-[#1A1A2E]"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}

      {/* Ustawienia: wysuwane menu od dołu (bottom sheet) */}
      <Sheet>
        <SheetTrigger
          className={cn(NAV_ITEM_CLASS, "text-[#9B9BAD] hover:text-[#1A1A2E]")}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium">Ustawienia</span>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-2xl bg-white gap-0 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          {/* Nagłówek: zalogowany użytkownik */}
          <div className="px-2 pb-3">
            <p className="text-[11px] uppercase tracking-wide text-[#9B9BAD]">
              Zalogowano jako
            </p>
            <p className="text-sm font-semibold text-[#1A1A2E] truncate">
              {user?.email ?? "…"}
            </p>
          </div>

          <div className="border-t border-[#EBEBF0]" />

          {/* Dokumentacja */}
          <SheetClose
            nativeButton={false}
            render={
              <Link
                href="/docs"
                className="flex items-center gap-3 px-2 py-3 mt-1 rounded-xl text-[#1A1A2E] hover:bg-black/[0.04] transition-colors"
              />
            }
          >
            <FileText className="h-5 w-5 text-[#9B9BAD]" />
            <span className="text-sm font-medium">Dokumentacja</span>
          </SheetClose>

          {/* Wyloguj */}
          <SheetClose
            render={
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-2 py-3 rounded-xl text-[#1A1A2E] hover:bg-black/[0.04] transition-colors"
              />
            }
          >
            <LogOut className="h-5 w-5 text-[#9B9BAD]" />
            <span className="text-sm font-medium">Wyloguj</span>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
