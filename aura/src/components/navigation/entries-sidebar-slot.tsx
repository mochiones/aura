"use client";

import { usePathname } from "next/navigation";
import { EntriesSidebar } from "@/components/entries-sidebar";
import { isAuthRoute } from "@/lib/utils";

/**
 * Renderuje sidebar wpisów wszędzie POZA trasami /docs (własny lewy pasek
 * API/MCP) i /login, /auth (pełnoekranowy ekran logowania bez chrome'u appki).
 */
export function EntriesSidebarSlot() {
  const pathname = usePathname();
  if (pathname.startsWith("/docs") || isAuthRoute(pathname)) return null;
  return <EntriesSidebar />;
}
