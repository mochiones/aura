"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { scrollToVisibleId } from "./scroll";

interface NavChild {
  label: string;
  id: string;
}
interface NavSection {
  label: string;
  href: string;
  children: NavChild[];
}

const NAV: NavSection[] = [
  {
    label: "API",
    href: "/docs",
    children: [
      { label: "Token", id: "token" },
      { label: "Dodawanie", id: "create" },
      { label: "Zapytanie", id: "ask" },
      { label: "Odczyt", id: "read" },
    ],
  },
  {
    label: "MCP",
    href: "/docs/mcp",
    children: [
      { label: "Konfiguracja", id: "konfiguracja" },
      { label: "Narzędzia", id: "narzedzia" },
    ],
  },
];

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-[14px] text-[#9B9BAD] transition-colors hover:text-[#1A1A2E]"
    >
      <ArrowLeft className="h-4 w-4" />
      Powrót do wpisów
    </Link>
  );
}

function NavList({
  pathname,
  orientation,
}: {
  pathname: string;
  orientation: "vertical" | "horizontal";
}) {
  // Kotwica: jeśli sekcja jest na bieżącej podstronie — skroluj płynnie (bez
  // przeładowania). W innym wypadku Link nawiguje, a HashScroller doskroluje.
  const handleAnchor = (
    e: React.MouseEvent,
    section: NavSection,
    child: NavChild
  ) => {
    if (pathname === section.href) {
      e.preventDefault();
      scrollToVisibleId(child.id);
      history.replaceState(null, "", `${section.href}#${child.id}`);
    }
  };

  return (
    <nav
      aria-label="Dokumentacja"
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-5"
          : "flex flex-row gap-5 overflow-x-auto"
      )}
    >
      {NAV.map((section) => {
        const active = pathname === section.href;
        return (
          <div key={section.href} className="flex-shrink-0">
            <Link
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block text-[13px] font-bold uppercase tracking-wide transition-colors",
                active ? "text-[#1A1A2E]" : "text-[#9B9BAD] hover:text-[#1A1A2E]"
              )}
            >
              {section.label}
            </Link>
            <div
              className={cn(
                "mt-2",
                orientation === "vertical"
                  ? "flex flex-col gap-1 border-l border-[#EBEBF0] pl-3"
                  : "flex flex-row gap-3"
              )}
            >
              {section.children.map((child) => (
                <Link
                  key={child.id}
                  href={`${section.href}#${child.id}`}
                  onClick={(e) => handleAnchor(e, section, child)}
                  className="whitespace-nowrap text-[13px] text-[#5A5A6E] transition-colors hover:text-[#1A1A2E]"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: pionowy pasek boczny, przyklejony; u góry przycisk powrotu */}
      <aside className="hidden md:block w-48 flex-shrink-0 border-r border-[#EBEBF0] px-4 py-8">
        <div className="sticky top-8">
          <div className="mb-6">
            <BackLink />
          </div>
          <NavList pathname={pathname} orientation="vertical" />
        </div>
      </aside>

      {/* Mobile: poziomy pasek nad treścią (przycisk powrotu jest w treści) */}
      <div className="md:hidden border-b border-[#EBEBF0] px-5 py-3">
        <NavList pathname={pathname} orientation="horizontal" />
      </div>
    </>
  );
}
