"use client";

import { usePathname } from "next/navigation";
import { EntriesSidebar } from "@/components/entries-sidebar";

/**
 * Renderuje sidebar wpisów wszędzie POZA trasami /docs — tam dokumentacja ma
 * własny lewy pasek (API/MCP), więc lista wpisów jest chowana (styl standardowej
 * dokumentacji).
 */
export function EntriesSidebarSlot() {
  const pathname = usePathname();
  if (pathname.startsWith("/docs")) return null;
  return <EntriesSidebar />;
}
